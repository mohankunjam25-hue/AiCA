import {
  LANGUAGE_CONFIGS,
  SupportedLanguage,
  CustomRunResult,
  CustomRunVerdict
} from '@aica/shared';
import { executeLocally } from './local-runner.service.js';

export interface SandboxExecutionOptions {
  language: SupportedLanguage;
  code: string;
  stdin?: string;
  baseTimeLimitSec?: number;
  memoryLimitKb?: number;
}

export class SandboxRunnerService {
  private judge0Url: string;
  private apiKey?: string;

  constructor(judge0Url?: string, apiKey?: string) {
    this.judge0Url = (judge0Url || process.env.JUDGE0_API_URL || 'http://localhost:2358').replace(/\/+$/, '');
    this.apiKey = apiKey || process.env.JUDGE0_API_KEY;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.apiKey) {
      headers['X-RapidAPI-Key'] = this.apiKey;
    }
    return headers;
  }

  public mapStatusToVerdict(statusId: number, statusDesc = ''): { verdict: CustomRunVerdict; isError: boolean } {
    const descLower = (statusDesc || '').toLowerCase();

    if (statusId === 6) {
      return { verdict: 'COMPILATION_ERROR', isError: true };
    }
    if (statusId === 5) {
      return { verdict: 'TIME_LIMIT_EXCEEDED', isError: true };
    }
    if (statusId === 12 || descLower.includes('memory')) {
      return { verdict: 'MEMORY_LIMIT_EXCEEDED', isError: true };
    }
    if (statusId >= 7 && statusId <= 11) {
      return { verdict: 'RUNTIME_ERROR', isError: true };
    }
    if (statusId === 3 || statusId === 4) {
      return { verdict: 'EXECUTED', isError: false };
    }
    if (statusId === 13) {
      return { verdict: 'INTERNAL_ERROR', isError: true };
    }
    return { verdict: 'RUNTIME_ERROR', isError: true };
  }

  public async executeEphemeral(options: SandboxExecutionOptions): Promise<CustomRunResult> {
    const { language, code, stdin = '', baseTimeLimitSec = 2.0, memoryLimitKb = 262144 } = options;

    const langConfig = LANGUAGE_CONFIGS[language];
    if (!langConfig) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const multiplier = langConfig.multiplier || 1.0;
    const scaledCpuLimit = Math.min(15.0, Math.max(1.0, baseTimeLimitSec * multiplier));
    const wallTimeLimit = scaledCpuLimit + 2.0;

    let finalCode = code;
    if (language === 'python' && /\b(list|dict|tuple|set)\[/.test(finalCode) && !finalCode.includes('__future__')) {
      finalCode = `from __future__ import annotations\n${finalCode}`;
    }

    const payload = {
      source_code: Buffer.from(finalCode).toString('base64'),
      language_id: langConfig.id,
      stdin: Buffer.from(stdin).toString('base64'),
      cpu_time_limit: scaledCpuLimit,
      wall_time_limit: wallTimeLimit,
      memory_limit: memoryLimitKb,
      enable_network: false,
      enable_per_process_and_thread_time_limit: true,
      enable_per_process_and_thread_memory_limit: true
    };

    let response: Response | null = null;
    try {
      response = await fetch(`${this.judge0Url}/submissions?base64_encoded=true&wait=true`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000)
      });
    } catch (fetchErr: any) {
      if (
        fetchErr.name === 'TimeoutError' ||
        fetchErr.name === 'AbortError' ||
        fetchErr.message?.toLowerCase().includes('timeout') ||
        fetchErr.message?.toLowerCase().includes('aborted')
      ) {
        const timeoutErr = new Error('Judge0 sandbox execution timed out after 15000ms');
        timeoutErr.name = 'TimeoutError';
        throw timeoutErr;
      }
      if (process.env.NODE_ENV === 'test') {
        throw fetchErr;
      }
      console.warn(`[SandboxRunnerService] Judge0 unavailable (${fetchErr.message}). Using local execution fallback.`);
      response = null;
    }

    if (!response || !response.ok) {
      if (response && response.status >= 400 && response.status < 500) {
        const errText = await response.text().catch(() => '');
        throw new Error(`Judge0 responded with HTTP ${response.status}: ${errText || response.statusText}`);
      }

      // Safe local subprocess execution fallback
      const localResult = await executeLocally({
        language,
        code,
        stdin,
        timeoutMs: Math.round(scaledCpuLimit * 1000),
        memoryLimitKb
      });

      const { verdict, isError } = this.mapStatusToVerdict(
        localResult.statusId,
        localResult.statusDescription
      );

      return {
        stdout: localResult.stdout,
        stderr: localResult.stderr,
        compileOutput: localResult.compileOutput,
        executionTimeMs: localResult.executionTimeMs,
        memoryUsedKb: localResult.memoryUsedKb,
        statusId: localResult.statusId,
        statusDescription: localResult.statusDescription,
        isError,
        verdict
      };
    }

    const data: any = await response.json();
    const stdout = data.stdout ? Buffer.from(data.stdout, 'base64').toString('utf8') : '';
    const stderr = data.stderr ? Buffer.from(data.stderr, 'base64').toString('utf8') : '';
    const compileOutput = data.compile_output ? Buffer.from(data.compile_output, 'base64').toString('utf8') : '';
    const execTimeMs = data.time ? Math.round(parseFloat(String(data.time)) * 1000) : 0;
    const memKb = data.memory || 0;
    const statusId = data.status_id || (data.status?.id ?? 3);
    const statusDescription = (data.status?.description === 'Accepted' || statusId === 3)
      ? 'Executed'
      : (data.status?.description || 'Executed');

    const { verdict, isError } = this.mapStatusToVerdict(statusId, statusDescription);

    return {
      stdout,
      stderr,
      compileOutput,
      executionTimeMs: execTimeMs,
      memoryUsedKb: memKb,
      statusId,
      statusDescription,
      isError,
      verdict
    };
  }
}
