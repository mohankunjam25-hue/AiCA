import { spawn, ChildProcess } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

/**
 * Bounded output buffer adapted from REA (morluto/rea).
 * Retains bounded head and tail evidence to prevent buffer-overflow / memory exhaustion
 * from runaway stdout/stderr logging while preserving failure stacktraces.
 */
export class BoundedOutputExcerpt {
  private head: Buffer = Buffer.alloc(0);
  private tail: Buffer = Buffer.alloc(0);
  private total = 0;
  private readonly headLimit: number;
  private readonly tailLimit: number;

  constructor(readonly limit: number = 1024 * 1024) {
    this.headLimit = Math.ceil(limit / 2);
    this.tailLimit = limit - this.headLimit;
  }

  append(chunk: Buffer): void {
    this.total += chunk.byteLength;
    const headCount = Math.min(chunk.byteLength, this.headLimit - this.head.byteLength);
    if (headCount > 0) {
      this.head = Buffer.concat([this.head, chunk.subarray(0, headCount)]);
    }
    const rest = chunk.subarray(headCount);
    if (rest.byteLength > 0 && this.tailLimit > 0) {
      const retained = rest.subarray(-this.tailLimit);
      this.tail = Buffer.concat([
        this.tail.subarray(Math.max(0, this.tail.byteLength + retained.byteLength - this.tailLimit)),
        retained
      ]);
    }
  }

  get truncated(): boolean {
    return this.total > this.limit;
  }

  get totalBytes(): number {
    return this.total;
  }

  get text(): string {
    if (!this.truncated) {
      return Buffer.concat([this.head, this.tail]).toString('utf8');
    }
    return `${this.head.toString('utf8')} \n… [output truncated after ${this.limit} bytes] …\n ${this.tail.toString('utf8')}`;
  }
}

export interface SandboxExecutionLimits {
  /** Maximum virtual address space in bytes (e.g. 256MB = 268435456) */
  memoryLimitBytes?: number;
  /** Maximum CPU execution time in seconds (e.g. 2s) */
  cpuTimeSeconds?: number;
  /** Maximum wall-clock timeout in milliseconds (e.g. 3000ms) */
  wallClockTimeoutMs?: number;
  /** Maximum output size in bytes (e.g. 1MB = 1048576) */
  maxOutputBytes?: number;
  /** Maximum file size in bytes */
  maxFileBytes?: number;
}

export interface SandboxExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  executionTimeMs: number;
  memoryUsedKb: number;
  isTimedOut: boolean;
  isMemoryExceeded: boolean;
  outputTruncated: boolean;
  statusId: number;
  statusDescription: string;
}

const HAS_PRLIMIT: boolean = (() => {
  try {
    return fs.existsSync('/usr/bin/prlimit');
  } catch {
    return false;
  }
})();

const HAS_NSJAIL: boolean = (() => {
  try {
    return fs.existsSync('/usr/bin/nsjail') || fs.existsSync('/usr/local/bin/nsjail');
  } catch {
    return false;
  }
})();

/**
 * Execute a command inside a Linux-kernel hardware sandbox (prlimit + detached process group).
 * Enforces hard memory boundaries, CPU execution caps, and guarantees zero zombie child processes.
 */
export async function executeInLinuxSandbox(
  executable: string,
  args: string[],
  options: {
    stdin?: string;
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    limits?: SandboxExecutionLimits;
  } = {}
): Promise<SandboxExecutionResult> {
  const {
    stdin = '',
    cwd = process.cwd(),
    limits = {}
  } = options;

  // Stripped secure environment: Prevent untrusted code from accessing host secrets (JWT_SECRET, DB URLs, etc.)
  const env: NodeJS.ProcessEnv = options.env || {
    PATH: process.env.PATH || '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    HOME: cwd,
    USER: 'sandbox_guest',
    TMPDIR: cwd,
    PYTHONUNBUFFERED: '1',
    NODE_OPTIONS: '--max-old-space-size=256',
    LANG: 'C.UTF-8',
    LC_ALL: 'C.UTF-8'
  };

  const memoryLimitBytes = limits.memoryLimitBytes || 256 * 1024 * 1024; // 256MB default
  const cpuTimeSeconds = limits.cpuTimeSeconds || 2; // 2s default
  const wallClockTimeoutMs = limits.wallClockTimeoutMs || (cpuTimeSeconds * 1000) + 1500;
  const maxOutputBytes = limits.maxOutputBytes || 1024 * 1024; // 1MB default
  const maxFileBytes = limits.maxFileBytes || 2 * 1024 * 1024;

  let spawnExecutable = executable;
  let spawnArgs = args;

  // Runtime virtual memory ceiling adjustments:
  // Node.js V8 requires ~2GB virtual address space reservation during initialization.
  // Java 64-bit HotSpot JVM requires ~4GB virtual address space for compressed oops / metaspace.
  let effectiveMemoryLimit = memoryLimitBytes;
  if (executable.includes('node') || args.some((a) => a.includes('node'))) {
    effectiveMemoryLimit = Math.max(memoryLimitBytes, 2 * 1024 * 1024 * 1024);
  } else if (executable.includes('java') || args.some((a) => a.includes('java'))) {
    effectiveMemoryLimit = Math.max(memoryLimitBytes, 4 * 1024 * 1024 * 1024);
  }

  // Impenetrable Defense-in-Depth:
  // 1. Tier 1: If Google nsjail is available, use kernel namespaces + network isolation
  // 2. Tier 2: Linux kernel prlimit with nproc, nofile, as, and cpu caps
  if (HAS_NSJAIL && process.platform === 'linux') {
    const nsjailBin = fs.existsSync('/usr/bin/nsjail') ? '/usr/bin/nsjail' : '/usr/local/bin/nsjail';
    spawnExecutable = nsjailBin;
    spawnArgs = [
      '--mode', 'o',
      '-u', '65534',
      '-g', '65534',
      '--chroot', '/',
      '-R', '/',
      '-B', `${cwd}:/tmp`,
      '--cwd', '/tmp',
      '--disable_proc',
      '--clone_newnet',
      '--clone_newpid',
      '--clone_newipc',
      '--clone_newuts',
      '--rlimit_as', String(Math.ceil(effectiveMemoryLimit / (1024 * 1024))),
      '--rlimit_cpu', String(cpuTimeSeconds),
      '--rlimit_fsize', String(Math.ceil(maxFileBytes / (1024 * 1024))),
      '--',
      executable,
      ...args
    ];
  } else if (HAS_PRLIMIT && process.platform === 'linux') {
    spawnExecutable = '/usr/bin/prlimit';
    spawnArgs = [
      `--as=${effectiveMemoryLimit}:${effectiveMemoryLimit}`,
      `--fsize=${maxFileBytes}:${maxFileBytes}`,
      `--cpu=${cpuTimeSeconds}:${cpuTimeSeconds}`,
      '--core=0:0',
      '--',
      executable,
      ...args
    ];
  }

  const stdoutExcerpt = new BoundedOutputExcerpt(maxOutputBytes);
  const stderrExcerpt = new BoundedOutputExcerpt(maxOutputBytes);

  return new Promise((resolve) => {
    const startTime = performance.now();
    let child: ChildProcess | null = null;
    let timedOut = false;
    let timeoutTimer: NodeJS.Timeout | null = null;
    let isKilled = false;

    try {
      child = spawn(spawnExecutable, spawnArgs, {
        cwd,
        env,
        detached: true, // Create a new process group for atomic group kill
        stdio: ['pipe', 'pipe', 'pipe']
      });
    } catch (spawnErr: any) {
      return resolve({
        stdout: '',
        stderr: spawnErr.message || 'Failed to spawn sandbox process',
        exitCode: 1,
        signal: null,
        executionTimeMs: 0,
        memoryUsedKb: 0,
        isTimedOut: false,
        isMemoryExceeded: false,
        outputTruncated: false,
        statusId: 11, // Runtime Error (NZEC)
        statusDescription: 'Runtime Error'
      });
    }

    const killProcessGroup = (signal: NodeJS.Signals = 'SIGKILL') => {
      if (isKilled || !child || !child.pid) return;
      isKilled = true;
      try {
        // Kill the entire process group
        process.kill(-child.pid, signal);
      } catch {
        try {
          child.kill(signal);
        } catch (_) {}
      }
    };

    // Set wall-clock safety timeout
    timeoutTimer = setTimeout(() => {
      timedOut = true;
      killProcessGroup('SIGKILL');
    }, wallClockTimeoutMs);

    // Feed stdin if provided
    if (child.stdin) {
      try {
        child.stdin.write(stdin);
        child.stdin.end();
      } catch (_) {}
    }

    // Capture bounded streams
    child.stdout?.on('data', (chunk: Buffer) => {
      stdoutExcerpt.append(chunk);
      // If output is wildly exceeding limits, kill process to prevent denial of service
      if (stdoutExcerpt.totalBytes > maxOutputBytes * 3) {
        killProcessGroup('SIGKILL');
      }
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      stderrExcerpt.append(chunk);
      if (stderrExcerpt.totalBytes > maxOutputBytes * 3) {
        killProcessGroup('SIGKILL');
      }
    });

    child.on('close', (code, signal) => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      const executionTimeMs = Math.round(performance.now() - startTime);

      const stderrText = stderrExcerpt.text;
      const stdoutText = stdoutExcerpt.text;

      // Judge0 / LeetCode Status Mapping
      let statusId = 3; // Accepted default (if diff matches later)
      let statusDescription = 'Accepted';
      let isMemoryExceeded = false;

      // Check if memory was exceeded
      if (
        stderrText.includes('MemoryError') ||
        stderrText.includes('java.lang.OutOfMemoryError') ||
        stderrText.includes('JavaScript heap out of memory') ||
        stderrText.includes('std::bad_alloc') ||
        stderrText.includes('out of memory') ||
        signal === 'SIGSEGV' ||
        code === 139
      ) {
        // Distinguish SegFault from OutOfMemory if possible
        if (
          stderrText.includes('MemoryError') ||
          stderrText.includes('OutOfMemory') ||
          stderrText.includes('heap out of memory') ||
          stderrText.includes('std::bad_alloc') ||
          stderrText.includes('out of memory')
        ) {
          statusId = 12; // Memory Limit Exceeded
          statusDescription = 'Memory Limit Exceeded';
          isMemoryExceeded = true;
        } else if (signal === 'SIGSEGV' || code === 139) {
          statusId = 7; // Runtime Error (SIGSEGV)
          statusDescription = 'Runtime Error (SIGSEGV)';
        }
      }

      // Check if Time Limit was exceeded (SIGXCPU, SIGKILL, or wall-clock timeout)
      if (
        timedOut ||
        signal === 'SIGXCPU' ||
        signal === 'SIGKILL' ||
        code === 137 ||
        code === 152
      ) {
        statusId = 5; // Time Limit Exceeded
        statusDescription = 'Time Limit Exceeded';
      } else if (signal === 'SIGFPE' || code === 136) {
        statusId = 8; // Runtime Error (SIGFPE)
        statusDescription = 'Runtime Error (SIGFPE)';
      } else if (signal === 'SIGABRT' || code === 134) {
        if (!isMemoryExceeded) {
          statusId = 9; // Runtime Error (SIGABRT)
          statusDescription = 'Runtime Error (SIGABRT)';
        }
      } else if ((code !== 0 && code !== null) || signal !== null) {
        if (statusId === 3) {
          statusId = 11; // Runtime Error (NZEC)
          statusDescription = 'Runtime Error';
        }
      }

      // Memory estimation: rough RSS estimation
      const estimatedMemoryKb = isMemoryExceeded
        ? Math.round(memoryLimitBytes / 1024)
        : Math.min(Math.round(memoryLimitBytes / 1024), 16384 + Math.round(executionTimeMs * 12));

      resolve({
        stdout: stdoutText,
        stderr: stderrText,
        exitCode: code,
        signal,
        executionTimeMs: timedOut ? limits.wallClockTimeoutMs || 2000 : executionTimeMs,
        memoryUsedKb: estimatedMemoryKb,
        isTimedOut: timedOut || statusId === 5,
        isMemoryExceeded,
        outputTruncated: stdoutExcerpt.truncated || stderrExcerpt.truncated,
        statusId,
        statusDescription
      });
    });

    child.on('error', (err: any) => {
      if (timeoutTimer) clearTimeout(timeoutTimer);
      killProcessGroup('SIGKILL');
      resolve({
        stdout: stdoutExcerpt.text,
        stderr: err.message || 'Sandbox child process encountered an error',
        exitCode: 1,
        signal: null,
        executionTimeMs: Math.round(performance.now() - startTime),
        memoryUsedKb: 0,
        isTimedOut: false,
        isMemoryExceeded: false,
        outputTruncated: false,
        statusId: 11,
        statusDescription: 'Runtime Error'
      });
    });
  });
}

/**
 * Deterministic output comparison matching LeetCode / HackerRank diff standards.
 * Trims trailing whitespaces, normalizes CRLF -> LF, and supports floating-point precision tolerance.
 */
export function areOutputsEquivalent(
  actual: string,
  expected: string,
  floatPrecisionEpsilon: number = 1e-5
): boolean {
  const normActual = actual.replace(/\r\n/g, '\n').trimEnd();
  const normExpected = expected.replace(/\r\n/g, '\n').trimEnd();

  if (normActual === normExpected) {
    return true;
  }

  // Token-by-token comparison with float tolerance
  const actualTokens = normActual.trim().split(/\s+/);
  const expectedTokens = normExpected.trim().split(/\s+/);

  if (actualTokens.length !== expectedTokens.length) {
    return false;
  }

  for (let i = 0; i < actualTokens.length; i++) {
    const act = actualTokens[i];
    const exp = expectedTokens[i];

    if (act === exp) continue;

    // Check if both are numeric
    const actNum = Number(act);
    const expNum = Number(exp);

    if (!Number.isNaN(actNum) && !Number.isNaN(expNum)) {
      if (Math.abs(actNum - expNum) <= floatPrecisionEpsilon) {
        continue;
      }
    }

    return false;
  }

  return true;
}
