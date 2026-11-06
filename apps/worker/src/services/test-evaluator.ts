import { Verdict, TestResultItem } from '@aica/shared';
import { Judge0BatchResultItem } from './judge0.service.js';

export interface EvaluatedTestOutcome {
  verdict: Verdict;
  passedCount: number;
  totalCount: number;
  maxExecutionTimeMs: number;
  maxMemoryKb: number;
  compileOutput?: string;
  testResults: TestResultItem[];
}

// Precedence ranking for competitive programming verdicts
const VERDICT_PRIORITY: Record<Verdict, number> = {
  COMPILATION_ERROR: 100,
  RUNTIME_ERROR: 80,
  TIME_LIMIT_EXCEEDED: 70,
  MEMORY_LIMIT_EXCEEDED: 60,
  WRONG_ANSWER: 50,
  INTERNAL_ERROR: 40,
  ACCEPTED: 10,
  PENDING: 0
};

export class TestEvaluatorService {
  public static getHigherPriorityVerdict(v1: Verdict, v2: Verdict): Verdict {
    return (VERDICT_PRIORITY[v2] || 0) > (VERDICT_PRIORITY[v1] || 0) ? v2 : v1;
  }

  public static decodeBase64(str?: string | null): string {
    if (!str) return '';
    try {
      return Buffer.from(str, 'base64').toString('utf8');
    } catch {
      return str;
    }
  }

  public static normalizeOutput(output: string): string {
    return output
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .trim();
  }

  public static compareOutputs(actualRaw: string, expectedRaw: string): boolean {
    const actual = this.normalizeOutput(actualRaw);
    const expected = this.normalizeOutput(expectedRaw);

    if (actual === expected) {
      return true;
    }

    // Token-based comparison (handles whitespace, multiple numbers, and float tolerance)
    const actualTokens = actual.split(/\s+/).filter(Boolean);
    const expectedTokens = expected.split(/\s+/).filter(Boolean);

    if (actualTokens.length > 0 && actualTokens.length === expectedTokens.length) {
      let allTokensMatch = true;
      for (let i = 0; i < actualTokens.length; i++) {
        const a = actualTokens[i];
        const e = expectedTokens[i];
        if (a === e) continue;

        const numA = parseFloat(a);
        const numE = parseFloat(e);
        if (!isNaN(numA) && !isNaN(numE) && Math.abs(numA - numE) <= 1e-6) {
          continue;
        }

        allTokensMatch = false;
        break;
      }
      if (allTokensMatch) return true;
    }

    return false;
  }

  public static evaluateBatch(
    tokenMappings: Array<{ token: string; testCaseId: string; index: number; isPublic: boolean; expectedOutput: string }>,
    judge0Results: Map<string, Judge0BatchResultItem>
  ): EvaluatedTestOutcome {
    let passedCount = 0;
    let maxTime = 0;
    let maxMem = 0;
    let aggregateVerdict: Verdict = 'ACCEPTED';
    let compileOutput = '';

    const testResults: TestResultItem[] = [];

    for (const mapping of tokenMappings) {
      const result = judge0Results.get(mapping.token);
      const statusId = result?.status_id || 13; // default internal error if missing

      const stdout = this.decodeBase64(result?.stdout);
      const stderr = this.decodeBase64(result?.stderr);
      const compileErr = this.decodeBase64(result?.compile_output);

      if (compileErr) {
        compileOutput = compileErr;
      }

      const execTimeMs = result?.time ? Math.round(parseFloat(String(result.time)) * 1000) : 0;
      const memKb = result?.memory || 0;

      if (execTimeMs > maxTime) maxTime = execTimeMs;
      if (memKb > maxMem) maxMem = memKb;

      let passed = false;
      let errorMsg: string | undefined;
      let caseVerdict: Verdict = 'ACCEPTED';

      if (statusId === 6 || statusId === 14) {
        // Compilation Error
        caseVerdict = 'COMPILATION_ERROR';
        errorMsg = compileOutput || stderr || 'Compilation failed';
      } else if (statusId === 5) {
        // Time Limit Exceeded
        caseVerdict = 'TIME_LIMIT_EXCEEDED';
        errorMsg = 'Time Limit Exceeded';
      } else if (statusId === 12) {
        // Memory Limit Exceeded
        caseVerdict = 'MEMORY_LIMIT_EXCEEDED';
        errorMsg = 'Memory Limit Exceeded';
      } else if (statusId >= 7 && statusId <= 11) {
        // Runtime Error (SIGSEGV, SIGFPE, SIGKILL, etc.)
        caseVerdict = 'RUNTIME_ERROR';
        errorMsg = stderr || 'Runtime error encountered';
      } else if (statusId === 3) {
        // Exit code 0 -> Check output equality
        const isMatch = this.compareOutputs(stdout, mapping.expectedOutput);
        if (isMatch) {
          passed = true;
          passedCount++;
          caseVerdict = 'ACCEPTED';
        } else {
          caseVerdict = 'WRONG_ANSWER';
          errorMsg = 'Output mismatch';
        }
      } else if (statusId === 4) {
        caseVerdict = 'WRONG_ANSWER';
        errorMsg = 'Output mismatch';
      } else {
        caseVerdict = 'INTERNAL_ERROR';
        errorMsg = 'Execution engine error';
      }

      aggregateVerdict = this.getHigherPriorityVerdict(aggregateVerdict, caseVerdict);

      testResults.push({
        testCaseId: mapping.testCaseId,
        index: mapping.index,
        passed,
        isPublic: mapping.isPublic,
        actualOutput: mapping.isPublic ? stdout : '[HIDDEN]',
        expectedOutput: mapping.isPublic ? mapping.expectedOutput : '[HIDDEN]',
        executionTimeMs: execTimeMs,
        memoryKb: memKb,
        errorMessage: errorMsg
      });
    }

    return {
      verdict: aggregateVerdict,
      passedCount,
      totalCount: tokenMappings.length,
      maxExecutionTimeMs: maxTime,
      maxMemoryKb: maxMem,
      compileOutput,
      testResults
    };
  }
}
