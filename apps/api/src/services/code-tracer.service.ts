import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { SupportedLanguage } from '@aica/shared';
import { executeInLinuxSandbox } from './linux-sandbox.js';

export interface RawTraceStep {
  step: number;
  line: number;
  event: 'line' | 'call' | 'return';
  locals: Record<string, any>;
  callStack?: string[];
}

export interface TraceExecutionResult {
  success: boolean;
  steps: RawTraceStep[];
  error?: string;
  executionTimeMs: number;
}

const JS_TRACER_TEMPLATE = `
const fs = require('fs');

const steps = [];
let stepCount = 0;
const MAX_STEPS = 350;

function serialize(val, depth = 0) {
  if (depth > 4) return String(val);
  if (val === null || val === undefined) return val;
  if (typeof val === 'number' || typeof val === 'string' || typeof val === 'boolean') return val;
  if (Array.isArray(val)) return val.slice(0, 40).map(x => serialize(x, depth + 1));
  if (val instanceof Set) return Array.from(val).slice(0, 40).map(x => serialize(x, depth + 1));
  if (val instanceof Map) {
    const obj = {};
    for (const [k, v] of val.entries()) {
      obj[String(k)] = serialize(v, depth + 1);
    }
    return obj;
  }
  if (typeof val === 'object') {
    const obj = {};
    for (const [k, v] of Object.entries(val).slice(0, 25)) {
      obj[k] = serialize(v, depth + 1);
    }
    return obj;
  }
  return String(val);
}

global.__trace = function(lineNo, localScope) {
  if (stepCount >= MAX_STEPS) return;
  stepCount++;
  const serialized = {};
  for (const [k, v] of Object.entries(localScope)) {
    if (k === '__trace' || typeof v === 'function') continue;
    serialized[k] = serialize(v);
  }
  steps.push({
    step: stepCount,
    line: lineNo,
    event: 'line',
    locals: serialized
  });
};

try {
  require('./instrumented_solution.js');
} catch (e) {
  // Catch runtime exceptions to preserve trace steps captured so far
} finally {
  fs.writeFileSync('trace_output.json', JSON.stringify(steps));
}
`;

export class CodeTracerService {
  /**
   * Executes arbitrary user code in the Linux sandbox and captures statement-by-statement
   * variable mutations without any AI dependency.
   */
  static async traceExecution(
    code: string,
    language: SupportedLanguage = 'python',
    stdin = ''
  ): Promise<TraceExecutionResult> {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aica-tracer-'));

    try {
      if (language === 'python') {
        const lines = code.split('\n');
        const originalLineCount = lines.length;

        // Check if code defines a function/class without calling it
        const funcMatch = code.match(/def\s+([a-zA-Z_]\w*)\s*\(/);
        const hasTopLevelCall = funcMatch
          ? new RegExp(`\\b${funcMatch[1]}\\s*\\(`).test(
              lines
                .filter(
                  (l) =>
                    !l.trim().startsWith('def ') &&
                    !l.trim().startsWith('#') &&
                    !l.trim().startsWith('"""')
                )
                .join('\n')
            )
          : false;

        let executableCode = code;
        if (funcMatch && !hasTopLevelCall) {
          const fnName = funcMatch[1];
          const autoDriver = `
# --- AICA AUTO-INVOCATION DRIVER ---
if True:
    import json, sys
    _raw_in = ""
    try:
        _raw_in = sys.stdin.read().strip()
    except Exception:
        pass

    _arg = None
    if _raw_in:
        try:
            _arg = json.loads(_raw_in)
        except Exception:
            _lines = [l.strip() for l in _raw_in.splitlines() if l.strip()]
            if len(_lines) > 1 and all(len(l.split()) == 2 for l in _lines[1:]):
                _arg = [[int(x) for x in l.split()] for l in _lines[1:]]
            elif len(_lines) >= 2 and _lines[0].isdigit():
                _tokens = " ".join(_lines[1:]).split()
                _arg = [int(x) if x.lstrip("-").isdigit() else x for x in _tokens]
            else:
                _tokens = _raw_in.split()
                _arg = [int(x) if x.lstrip("-").isdigit() else x for x in _tokens]
    
    if _arg is None:
        _arg = [[1, 3], [2, 6], [8, 10], [15, 18]]

    try:
        if "Solution" in globals():
            _inst = Solution()
            _func = getattr(_inst, "${fnName}", None)
            if _func:
                if isinstance(_arg, list) and "${fnName}" == "twoSum" and len(_arg) >= 3:
                    _func(_arg[:-1], _arg[-1])
                else:
                    _func(_arg)
        elif "${fnName}" in globals():
            _func = globals().get("${fnName}")
            if isinstance(_arg, list) and "${fnName}" == "twoSum" and len(_arg) >= 3:
                _func(_arg[:-1], _arg[-1])
            else:
                _func(_arg)
    except Exception:
        pass
`;
          executableCode = `${code}\n${autoDriver}`;
        }

        const tracerScript = `
import sys
import json
import inspect

class ExecutionTracer:
    def __init__(self, max_steps=350, max_line=${originalLineCount}):
        self.steps = []
        self.max_steps = max_steps
        self.max_line = max_line
        self.count = 0

    def serialize(self, val, depth=0):
        if depth > 4:
            return repr(val)
        if isinstance(val, (int, float, str, bool)) or val is None:
            return val
        if isinstance(val, (list, tuple, set)):
            return [self.serialize(x, depth + 1) for x in list(val)[:40]]
        if isinstance(val, dict):
            return {str(k): self.serialize(v, depth + 1) for k, v in list(val.items())[:30]}
        if hasattr(val, "__dict__"):
            return {str(k): self.serialize(v, depth + 1) for k, v in list(val.__dict__.items())[:20]}
        return repr(val)

    def trace_lines(self, frame, event, arg):
        if self.count >= self.max_steps:
            return None

        # Only trace the user script
        if frame.f_code.co_filename != "solution.py":
            return self.trace_lines

        # Ignore lines in the synthetic driver
        if frame.f_lineno > self.max_line:
            return self.trace_lines

        if event in ("line", "return"):
            self.count += 1
            line_no = frame.f_lineno
            locals_snapshot = {}

            for var_name, var_val in frame.f_locals.items():
                if var_name.startswith("__") or inspect.isfunction(var_val) or inspect.ismodule(var_val):
                    continue
                locals_snapshot[var_name] = self.serialize(var_val)

            self.steps.append({
                "step": self.count,
                "line": line_no,
                "event": event,
                "locals": locals_snapshot,
                "callStack": [f.function for f in inspect.stack()[:3]]
            })

        return self.trace_lines

tracer = ExecutionTracer(max_steps=350, max_line=${originalLineCount})
sys.settrace(tracer.trace_lines)

try:
    with open("solution.py", "r", encoding="utf-8") as f:
        code_str = f.read()
    compiled_code = compile(code_str, "solution.py", "exec")
    exec(compiled_code, {})
except Exception as e:
    pass
finally:
    sys.settrace(None)
    with open("trace_output.json", "w", encoding="utf-8") as f:
        json.dump(tracer.steps, f)
`;

        fs.writeFileSync(path.join(tempDir, 'solution.py'), executableCode, 'utf-8');
        fs.writeFileSync(path.join(tempDir, 'run_tracer.py'), tracerScript, 'utf-8');

        const startTime = Date.now();
        const sandboxRes = await executeInLinuxSandbox(
          'python3',
          ['run_tracer.py'],
          {
            stdin,
            cwd: tempDir,
            limits: { wallClockTimeoutMs: 3500, memoryLimitBytes: 128 * 1024 * 1024 }
          }
        );
        const executionTimeMs = Date.now() - startTime;

        const traceFile = path.join(tempDir, 'trace_output.json');
        if (fs.existsSync(traceFile)) {
          const rawData = fs.readFileSync(traceFile, 'utf-8');
          const steps: RawTraceStep[] = JSON.parse(rawData || '[]');
          return {
            success: true,
            steps,
            executionTimeMs
          };
        }

        return {
          success: false,
          steps: [],
          error: sandboxRes.stderr || 'Tracer failed to produce output',
          executionTimeMs
        };
      } else if (language === 'javascript') {
        // Simple JS statement instrumentation by inserting __trace(line, { ... })
        const lines = code.split('\n');
        const instrumentedLines = lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
            return line;
          }
          // Wrap statement with trace callback capturing global variables
          return `${line}\nif (typeof __trace === 'function') __trace(${idx + 1}, (function(){ try { return { ...this }; } catch(e){ return {}; } }).call(this));`;
        });

        fs.writeFileSync(path.join(tempDir, 'instrumented_solution.js'), instrumentedLines.join('\n'), 'utf-8');
        fs.writeFileSync(path.join(tempDir, 'run_tracer.js'), JS_TRACER_TEMPLATE, 'utf-8');

        const startTime = Date.now();
        const sandboxRes = await executeInLinuxSandbox(
          'node',
          ['run_tracer.js'],
          {
            stdin,
            cwd: tempDir,
            limits: { wallClockTimeoutMs: 3500, memoryLimitBytes: 128 * 1024 * 1024 }
          }
        );
        const executionTimeMs = Date.now() - startTime;

        const traceFile = path.join(tempDir, 'trace_output.json');
        if (fs.existsSync(traceFile)) {
          const rawData = fs.readFileSync(traceFile, 'utf-8');
          const steps: RawTraceStep[] = JSON.parse(rawData || '[]');
          return {
            success: true,
            steps,
            executionTimeMs
          };
        }

        return {
          success: false,
          steps: [],
          error: sandboxRes.stderr || 'Tracer failed to produce output',
          executionTimeMs
        };
      }

      return {
        success: false,
        steps: [],
        error: `Tracer not currently supported for language: ${language}`,
        executionTimeMs: 0
      };
    } catch (err: any) {
      return {
        success: false,
        steps: [],
        error: err.message || 'Sandbox tracer failed',
        executionTimeMs: 0
      };
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {}
    }
  }
}
