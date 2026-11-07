import { spawn, ChildProcess } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  SupportedLanguage,
  Verdict,
  TestResultItem,
  UniversalDriverService,
  FunctionSignature
} from '@aica/shared';
import {
  executeInLinuxSandbox,
  BoundedOutputExcerpt,
  SandboxExecutionLimits,
  areOutputsEquivalent
} from './linux-sandbox.js';
import { TestEvaluatorService } from './test-evaluator.js';

export interface LocalExecutionInput {
  language: SupportedLanguage;
  code: string;
  stdin?: string;
  timeoutMs?: number;
  memoryLimitKb?: number;
  signature?: FunctionSignature;
}

export interface LocalExecutionOutput {
  stdout: string;
  stderr: string;
  compileOutput: string;
  executionTimeMs: number;
  memoryUsedKb: number;
  statusId: number;
  statusDescription: string;
}

export function wrapCodeWithDriver(
  code: string,
  language: SupportedLanguage,
  signature?: FunctionSignature
): string {
  if (UniversalDriverService.hasStandardIO(code, language)) {
    return code;
  }
  return UniversalDriverService.wrapCode(code, language, signature);
}

async function compileSource(
  cmd: string,
  args: string[],
  cwd: string,
  timeoutMs = 10000
): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    let child: ChildProcess;
    try {
      child = spawn(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err: any) {
      return resolve({ success: false, output: err.message || 'Compiler spawn failed' });
    }

    const excerpt = new BoundedOutputExcerpt(256 * 1024);
    const timer = setTimeout(() => {
      try {
        child.kill('SIGKILL');
      } catch (_) {}
      resolve({ success: false, output: 'Compilation timed out after 10000ms' });
    }, timeoutMs);

    child.stdout?.on('data', (d: Buffer) => excerpt.append(d));
    child.stderr?.on('data', (d: Buffer) => excerpt.append(d));

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ success: true, output: '' });
      } else {
        resolve({ success: false, output: excerpt.text || `Compilation exited with status ${code}` });
      }
    });

    child.on('error', (err: any) => {
      clearTimeout(timer);
      resolve({ success: false, output: err.message || 'Compiler failed to execute' });
    });
  });
}

export async function executeLocally(input: LocalExecutionInput): Promise<LocalExecutionOutput> {
  const { language, stdin = '', timeoutMs = 5000, memoryLimitKb } = input;
  const code = wrapCodeWithDriver(input.code, language, input.signature);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aica-run-'));

  const memoryLimitBytes = memoryLimitKb ? memoryLimitKb * 1024 : 256 * 1024 * 1024;
  const cpuTimeSeconds = Math.max(1, Math.ceil(timeoutMs / 1000));
  const limits: SandboxExecutionLimits = {
    memoryLimitBytes,
    cpuTimeSeconds,
    wallClockTimeoutMs: timeoutMs + 1000
  };

  try {
    if (language === 'python') {
      const scriptPath = path.join(tempDir, 'solution.py');
      fs.writeFileSync(scriptPath, code);

      const sandboxRes = await executeInLinuxSandbox(
        'python3',
        ['-u', scriptPath],
        { stdin, cwd: tempDir, limits }
      );

      return {
        stdout: sandboxRes.stdout,
        stderr: sandboxRes.stderr,
        compileOutput: '',
        executionTimeMs: sandboxRes.executionTimeMs,
        memoryUsedKb: sandboxRes.memoryUsedKb,
        statusId: sandboxRes.statusId,
        statusDescription: sandboxRes.statusDescription
      };
    }

    if (language === 'javascript') {
      const scriptPath = path.join(tempDir, 'solution.js');
      fs.writeFileSync(scriptPath, code);

      const nodeBin = process.execPath || 'node';
      const sandboxRes = await executeInLinuxSandbox(
        nodeBin,
        ['--max-old-space-size=256', scriptPath],
        { stdin, cwd: tempDir, limits }
      );

      return {
        stdout: sandboxRes.stdout,
        stderr: sandboxRes.stderr,
        compileOutput: '',
        executionTimeMs: sandboxRes.executionTimeMs,
        memoryUsedKb: sandboxRes.memoryUsedKb,
        statusId: sandboxRes.statusId,
        statusDescription: sandboxRes.statusDescription
      };
    }

    if (language === 'cpp') {
      const srcPath = path.join(tempDir, 'solution.cpp');
      const binPath = path.join(tempDir, 'solution');
      fs.writeFileSync(srcPath, code);

      const comp = await compileSource('g++', ['-O3', '-std=c++17', srcPath, '-o', binPath], tempDir);
      if (!comp.success) {
        return {
          stdout: '',
          stderr: '',
          compileOutput: comp.output,
          executionTimeMs: 0,
          memoryUsedKb: 0,
          statusId: 6,
          statusDescription: 'Compilation Error'
        };
      }

      const sandboxRes = await executeInLinuxSandbox(
        binPath,
        [],
        { stdin, cwd: tempDir, limits }
      );

      return {
        stdout: sandboxRes.stdout,
        stderr: sandboxRes.stderr,
        compileOutput: '',
        executionTimeMs: sandboxRes.executionTimeMs,
        memoryUsedKb: sandboxRes.memoryUsedKb,
        statusId: sandboxRes.statusId,
        statusDescription: sandboxRes.statusDescription
      };
    }

    if (language === 'java') {
      const srcPath = path.join(tempDir, 'Main.java');
      fs.writeFileSync(srcPath, code);

      const comp = await compileSource('javac', [srcPath], tempDir);
      if (!comp.success) {
        return {
          stdout: '',
          stderr: '',
          compileOutput: comp.output,
          executionTimeMs: 0,
          memoryUsedKb: 0,
          statusId: 6,
          statusDescription: 'Compilation Error'
        };
      }

      const sandboxRes = await executeInLinuxSandbox(
        'java',
        ['-Xmx256m', '-cp', tempDir, 'Main'],
        { stdin, cwd: tempDir, limits }
      );

      return {
        stdout: sandboxRes.stdout,
        stderr: sandboxRes.stderr,
        compileOutput: '',
        executionTimeMs: sandboxRes.executionTimeMs,
        memoryUsedKb: sandboxRes.memoryUsedKb,
        statusId: sandboxRes.statusId,
        statusDescription: sandboxRes.statusDescription
      };
    }

    throw new Error(`Unsupported language for local runner: ${language}`);
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

export interface SuiteTestCaseInput {
  id: string;
  index: number;
  isPublic: boolean;
  stdin: string;
  expectedOutput: string;
}

export interface SuiteExecutionInput {
  language: SupportedLanguage;
  code: string;
  testCases: SuiteTestCaseInput[];
  timeoutMs?: number;
  memoryLimitKb?: number;
  shortCircuitOnFailure?: boolean;
  signature?: FunctionSignature;
  onProgress?: (progress: { current: number; total: number; testCaseId: string }) => Promise<void> | void;
}

export interface SuiteExecutionOutput {
  verdict: Verdict;
  passedCount: number;
  totalCount: number;
  maxExecutionTimeMs: number;
  maxMemoryKb: number;
  compileOutput: string;
  testResults: TestResultItem[];
}

/**
 * Executes an entire problem test suite inside the Linux sandbox with single-compilation and
 * LeetCode-grade short-circuiting on failure.
 */
export async function executeSuiteInSandbox(input: SuiteExecutionInput): Promise<SuiteExecutionOutput> {
  const {
    language,
    testCases,
    timeoutMs = 2000,
    memoryLimitKb = 262144,
    shortCircuitOnFailure = true,
    onProgress
  } = input;

  if (!testCases || testCases.length === 0) {
    return {
      verdict: 'ACCEPTED',
      passedCount: 0,
      totalCount: 0,
      maxExecutionTimeMs: 0,
      maxMemoryKb: 0,
      compileOutput: '',
      testResults: []
    };
  }

  const code = wrapCodeWithDriver(input.code, language, input.signature);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aica-suite-'));

  const memoryLimitBytes = memoryLimitKb * 1024;
  const cpuTimeSeconds = Math.max(1, Math.ceil(timeoutMs / 1000));
  const limits: SandboxExecutionLimits = {
    memoryLimitBytes,
    cpuTimeSeconds,
    wallClockTimeoutMs: timeoutMs + 1000
  };

  let executable = '';
  let execArgs: string[] = [];

  try {
    // 1. Compilation & Preparation Phase (Single Compile for entire suite!)
    if (language === 'python') {
      const scriptPath = path.join(tempDir, 'solution.py');
      fs.writeFileSync(scriptPath, code);
      executable = 'python3';
      execArgs = ['-u', scriptPath];
    } else if (language === 'javascript') {
      const scriptPath = path.join(tempDir, 'solution.js');
      fs.writeFileSync(scriptPath, code);
      executable = process.execPath || 'node';
      execArgs = ['--max-old-space-size=256', scriptPath];
    } else if (language === 'cpp') {
      const srcPath = path.join(tempDir, 'solution.cpp');
      const binPath = path.join(tempDir, 'solution');
      fs.writeFileSync(srcPath, code);

      const comp = await compileSource('g++', ['-O3', '-std=c++17', srcPath, '-o', binPath], tempDir);
      if (!comp.success) {
        return {
          verdict: 'COMPILATION_ERROR',
          passedCount: 0,
          totalCount: testCases.length,
          maxExecutionTimeMs: 0,
          maxMemoryKb: 0,
          compileOutput: comp.output,
          testResults: testCases.map((tc) => ({
            testCaseId: tc.id,
            index: tc.index,
            passed: false,
            isPublic: tc.isPublic,
            actualOutput: tc.isPublic ? '' : '[HIDDEN]',
            expectedOutput: tc.isPublic ? tc.expectedOutput : '[HIDDEN]',
            executionTimeMs: 0,
            memoryKb: 0,
            errorMessage: 'Compilation Error'
          }))
        };
      }
      executable = binPath;
      execArgs = [];
    } else if (language === 'java') {
      const srcPath = path.join(tempDir, 'Main.java');
      fs.writeFileSync(srcPath, code);

      const comp = await compileSource('javac', [srcPath], tempDir);
      if (!comp.success) {
        return {
          verdict: 'COMPILATION_ERROR',
          passedCount: 0,
          totalCount: testCases.length,
          maxExecutionTimeMs: 0,
          maxMemoryKb: 0,
          compileOutput: comp.output,
          testResults: testCases.map((tc) => ({
            testCaseId: tc.id,
            index: tc.index,
            passed: false,
            isPublic: tc.isPublic,
            actualOutput: tc.isPublic ? '' : '[HIDDEN]',
            expectedOutput: tc.isPublic ? tc.expectedOutput : '[HIDDEN]',
            executionTimeMs: 0,
            memoryKb: 0,
            errorMessage: 'Compilation Error'
          }))
        };
      }
      executable = 'java';
      execArgs = ['-Xmx256m', '-cp', tempDir, 'Main'];
    } else {
      throw new Error(`Unsupported language for local runner: ${language}`);
    }

    // 2. Sequential & Short-Circuit Execution Phase
    let passedCount = 0;
    let maxTimeMs = 0;
    let maxMemKb = 0;
    let aggregateVerdict: Verdict = 'ACCEPTED';
    const testResults: TestResultItem[] = [];

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];

      if (onProgress) {
        try {
          await onProgress({ current: i + 1, total: testCases.length, testCaseId: tc.id });
        } catch (_) {}
      }

      const sandboxRes = await executeInLinuxSandbox(executable, execArgs, {
        stdin: tc.stdin,
        cwd: tempDir,
        limits
      });

      let passed = false;
      let caseVerdict: Verdict = 'ACCEPTED';
      let errorMsg: string | undefined;

      if (sandboxRes.statusId === 3) {
        const isMatch = areOutputsEquivalent(sandboxRes.stdout, tc.expectedOutput);
        if (isMatch) {
          passed = true;
          passedCount++;
          caseVerdict = 'ACCEPTED';
        } else {
          caseVerdict = 'WRONG_ANSWER';
          errorMsg = 'Output mismatch';
        }
      } else if (sandboxRes.statusId === 5) {
        caseVerdict = 'TIME_LIMIT_EXCEEDED';
        errorMsg = 'Time Limit Exceeded';
      } else if (sandboxRes.statusId === 12) {
        caseVerdict = 'MEMORY_LIMIT_EXCEEDED';
        errorMsg = 'Memory Limit Exceeded';
      } else if (sandboxRes.statusId >= 7 && sandboxRes.statusId <= 11) {
        caseVerdict = 'RUNTIME_ERROR';
        errorMsg = sandboxRes.stderr || 'Runtime error encountered';
      } else {
        caseVerdict = 'INTERNAL_ERROR';
        errorMsg = 'Execution error';
      }

      maxTimeMs = Math.max(maxTimeMs, sandboxRes.executionTimeMs);
      maxMemKb = Math.max(maxMemKb, sandboxRes.memoryUsedKb);

      testResults.push({
        testCaseId: tc.id,
        index: tc.index,
        passed,
        isPublic: tc.isPublic,
        actualOutput: tc.isPublic ? sandboxRes.stdout : '[HIDDEN]',
        expectedOutput: tc.isPublic ? tc.expectedOutput : '[HIDDEN]',
        executionTimeMs: sandboxRes.executionTimeMs,
        memoryKb: sandboxRes.memoryUsedKb,
        errorMessage: errorMsg
      });

      aggregateVerdict = TestEvaluatorService.getHigherPriorityVerdict(aggregateVerdict, caseVerdict);

      // Short-circuit on failure (LeetCode behavior: stop immediately on first failing test)
      if (!passed && shortCircuitOnFailure) {
        for (let j = i + 1; j < testCases.length; j++) {
          const remainingTc = testCases[j];
          testResults.push({
            testCaseId: remainingTc.id,
            index: remainingTc.index,
            passed: false,
            isPublic: remainingTc.isPublic,
            actualOutput: remainingTc.isPublic ? '' : '[HIDDEN]',
            expectedOutput: remainingTc.isPublic ? remainingTc.expectedOutput : '[HIDDEN]',
            executionTimeMs: 0,
            memoryKb: 0,
            errorMessage: 'Skipped due to earlier test failure'
          });
        }
        break;
      }
    }

    return {
      verdict: aggregateVerdict,
      passedCount,
      totalCount: testCases.length,
      maxExecutionTimeMs: maxTimeMs,
      maxMemoryKb: maxMemKb,
      compileOutput: '',
      testResults
    };
  } finally {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}
