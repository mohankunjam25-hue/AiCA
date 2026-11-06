import { describe, it, expect } from 'vitest';
import { executeInLinuxSandbox, areOutputsEquivalent, BoundedOutputExcerpt } from '../apps/worker/src/services/linux-sandbox.js';
import { executeLocally, executeSuiteInSandbox } from '../apps/worker/src/services/local-runner.service.js';
import { TestEvaluatorService } from '../apps/worker/src/services/test-evaluator.js';

describe('REA-Adapted Production Sandbox & Execution Engine', () => {
  describe('1. Bounded Stream Buffer (morluto/rea BoundedOutputExcerpt)', () => {
    it('should retain small output verbatim without truncation', () => {
      const excerpt = new BoundedOutputExcerpt(1024);
      excerpt.append(Buffer.from('Hello, World!\n'));
      expect(excerpt.truncated).toBe(false);
      expect(excerpt.text).toBe('Hello, World!\n');
      expect(excerpt.totalBytes).toBe(14);
    });

    it('should cleanly bound massive stream buffers, preserving head and tail', () => {
      const excerpt = new BoundedOutputExcerpt(100);
      const chunk1 = Buffer.from('HEAD_START_1234567890_HEAD_END_');
      const chunk2 = Buffer.from('X'.repeat(500));
      const chunk3 = Buffer.from('_TAIL_START_1234567890_TAIL_END');

      excerpt.append(chunk1);
      excerpt.append(chunk2);
      excerpt.append(chunk3);

      expect(excerpt.truncated).toBe(true);
      expect(excerpt.totalBytes).toBe(chunk1.byteLength + chunk2.byteLength + chunk3.byteLength);
      const text = excerpt.text;
      expect(text).toContain('output truncated after 100 bytes');
      expect(text).toContain('HEAD_START');
      expect(text).toContain('TAIL_END');
    });
  });

  describe('2. Deterministic LeetCode/HackerRank Output Diffing (areOutputsEquivalent)', () => {
    it('should match identical strings regardless of CRLF vs LF or trailing newlines', () => {
      expect(areOutputsEquivalent('42\r\n', '42\n')).toBe(true);
      expect(areOutputsEquivalent('line1\r\nline2  \r\n', 'line1\nline2')).toBe(true);
    });

    it('should match multiple space-separated tokens with different internal spacing', () => {
      expect(areOutputsEquivalent('1   2    3', '1 2 3')).toBe(true);
      expect(areOutputsEquivalent('0\n1\n2', '0 1 2')).toBe(true);
    });

    it('should tolerate floating-point epsilon differences within 1e-5', () => {
      expect(areOutputsEquivalent('3.141592', '3.141590')).toBe(true);
      expect(areOutputsEquivalent('0.000001', '0.000002')).toBe(true);
      expect(areOutputsEquivalent('1.5 2.700001', '1.5 2.700009')).toBe(true);
    });

    it('should reject different tokens and values beyond float epsilon', () => {
      expect(areOutputsEquivalent('1 2 3', '1 2 4')).toBe(false);
      expect(areOutputsEquivalent('3.14', '3.25')).toBe(false);
      expect(areOutputsEquivalent('true', 'false')).toBe(false);
      expect(areOutputsEquivalent('1 2', '1 2 3')).toBe(false);
    });
  });

  describe('3. Linux Kernel Hardware Sandbox (executeInLinuxSandbox)', () => {
    it('should execute Python successfully with stdin and capture stdout', async () => {
      const res = await executeInLinuxSandbox('python3', ['-c', 'import sys; print("RESULT:", sys.stdin.read().strip())'], {
        stdin: 'ANTIGRAVITY_42'
      });

      expect(res.exitCode).toBe(0);
      expect(res.statusId).toBe(3);
      expect(res.statusDescription).toBe('Accepted');
      expect(res.stdout.trim()).toBe('RESULT: ANTIGRAVITY_42');
      expect(res.isTimedOut).toBe(false);
      expect(res.isMemoryExceeded).toBe(false);
    });

    it('should trap Python Runtime Error (NZEC) cleanly', async () => {
      const res = await executeInLinuxSandbox('python3', ['-c', '1 / 0']);

      expect(res.exitCode).toBe(1);
      expect(res.statusId).toBe(11);
      expect(res.statusDescription).toBe('Runtime Error');
      expect(res.stderr).toContain('ZeroDivisionError');
    });

    it('should enforce CPU / Wall-Clock Time Limits on infinite loops (TLE)', async () => {
      const startTime = performance.now();
      const res = await executeInLinuxSandbox('python3', ['-c', 'while True: pass'], {
        limits: {
          cpuTimeSeconds: 1,
          wallClockTimeoutMs: 1500
        }
      });
      const elapsed = performance.now() - startTime;

      expect(res.statusId).toBe(5);
      expect(res.statusDescription).toBe('Time Limit Exceeded');
      expect(res.isTimedOut).toBe(true);
      expect(elapsed).toBeLessThan(3500);
    });

    it('should enforce Memory Limits via Linux kernel prlimit (MLE)', async () => {
      // Allocate 100M integers in Python (approx 800MB memory) under 128MB limit
      const res = await executeInLinuxSandbox('python3', ['-c', 'a = [0] * (10**8)'], {
        limits: {
          memoryLimitBytes: 128 * 1024 * 1024 // 128MB ceiling
        }
      });

      expect(res.statusId).toBe(12);
      expect(res.statusDescription).toBe('Memory Limit Exceeded');
      expect(res.isMemoryExceeded).toBe(true);
      expect(res.stderr).toContain('MemoryError');
    });

    it('should throttle runaway log output and kill stream flooders (DoS Protection)', async () => {
      const res = await executeInLinuxSandbox(
        'python3',
        ['-c', 'import sys\nwhile True:\n    sys.stdout.write("SPAM_LOG_FLOOD\\n")'],
        {
          limits: {
            maxOutputBytes: 10 * 1024, // 10KB cap
            cpuTimeSeconds: 2,
            wallClockTimeoutMs: 2000
          }
        }
      );

      expect(res.outputTruncated).toBe(true);
      expect(res.stdout.length).toBeLessThan(100 * 1024);
      expect(res.stdout).toContain('SPAM_LOG_FLOOD');
    });
  });

  describe('4. Multi-Language Runner (executeLocally)', () => {
    it('should compile and execute C++ solution correctly', async () => {
      const cppCode = `
#include <iostream>
int main() {
    int a, b;
    if (std::cin >> a >> b) {
        std::cout << (a + b) << std::endl;
    }
    return 0;
}
`;
      const res = await executeLocally({
        language: 'cpp',
        code: cppCode,
        stdin: '15 27',
        timeoutMs: 3000
      });

      expect(res.statusId).toBe(3);
      expect(res.statusDescription).toBe('Accepted');
      expect(res.stdout.trim()).toBe('42');
      expect(res.compileOutput).toBe('');
    });

    it('should trap C++ Compilation Error and return detailed compiler diagnostics', async () => {
      const invalidCpp = `
#include <iostream>
int main() {
    this_is_a_syntax_error_undefined_symbol();
    return 0;
}
`;
      const res = await executeLocally({
        language: 'cpp',
        code: invalidCpp,
        stdin: '',
        timeoutMs: 3000
      });

      expect(res.statusId).toBe(6);
      expect(res.statusDescription).toBe('Compilation Error');
      expect(res.compileOutput).toContain('this_is_a_syntax_error_undefined_symbol');
    });

    it('should execute JavaScript solution under local runner', async () => {
      const jsCode = `
const fs = require('fs');
const [a, b] = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);
console.log(a * b);
`;
      const res = await executeLocally({
        language: 'javascript',
        code: jsCode,
        stdin: '6 7',
        timeoutMs: 3000
      });

      expect(res.statusId).toBe(3);
      expect(res.statusDescription).toBe('Accepted');
      expect(res.stdout.trim()).toBe('42');
    });

    it('should execute Python solution with automatic driver wrap', async () => {
      const pyCode = `
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []
`;
      // Stdin format: 4 2 7 11 15 9 (length, elements, target)
      const res = await executeLocally({
        language: 'python',
        code: pyCode,
        stdin: '4 2 7 11 15 9',
        timeoutMs: 3000
      });

      expect(res.statusId).toBe(3);
      expect(res.statusDescription).toBe('Accepted');
      expect(res.stdout.trim()).toBe('0 1');
    });
  });

  describe('5. Zero-Leakage Hidden Test Case Masking (TestEvaluatorService)', () => {
    it('should strictly mask actualOutput and expectedOutput for hidden test cases', () => {
      const tokenMappings = [
        {
          token: 'tok-pub-1',
          testCaseId: 'tc-1',
          index: 1,
          isPublic: true,
          expectedOutput: '42'
        },
        {
          token: 'tok-hid-2',
          testCaseId: 'tc-2',
          index: 2,
          isPublic: false,
          expectedOutput: 'SECRET_HIDDEN_ANSWER_999'
        }
      ];

      const judge0Results = new Map([
        [
          'tok-pub-1',
          {
            token: 'tok-pub-1',
            status_id: 3,
            status: { id: 3, description: 'Accepted' },
            stdout: Buffer.from('42\n').toString('base64'),
            stderr: null,
            time: '0.015',
            memory: 15400
          }
        ],
        [
          'tok-hid-2',
          {
            token: 'tok-hid-2',
            status_id: 3,
            status: { id: 3, description: 'Accepted' },
            stdout: Buffer.from('WRONG_USER_LEAKED_OUTPUT\n').toString('base64'),
            stderr: null,
            time: '0.020',
            memory: 16200
          }
        ]
      ]);

      const outcome = TestEvaluatorService.evaluateBatch(tokenMappings, judge0Results);

      expect(outcome.totalCount).toBe(2);
      expect(outcome.passedCount).toBe(1);
      expect(outcome.verdict).toBe('WRONG_ANSWER');

      // Public test case has unmasked output
      const publicResult = outcome.testResults.find((r) => r.isPublic);
      expect(publicResult?.actualOutput).toBe('42\n');
      expect(publicResult?.expectedOutput).toBe('42');
      expect(publicResult?.passed).toBe(true);

      // Hidden test case MUST be masked
      const hiddenResult = outcome.testResults.find((r) => !r.isPublic);
      expect(hiddenResult?.actualOutput).toBe('[HIDDEN]');
      expect(hiddenResult?.expectedOutput).toBe('[HIDDEN]');
      expect(hiddenResult?.passed).toBe(false);
      expect(hiddenResult?.executionTimeMs).toBe(20);
      expect(hiddenResult?.memoryKb).toBe(16200);
    });
  });

  describe('6. Single-Compile & Short-Circuiting Suite Runner (executeSuiteInSandbox)', () => {
    it('should execute multiple test cases and return ACCEPTED when all match', async () => {
      const pyCode = `
import sys
line = sys.stdin.read().strip()
if line:
    print(int(line) * 2)
`;
      const testCases = [
        { id: 'tc-1', index: 1, isPublic: true, stdin: '5', expectedOutput: '10' },
        { id: 'tc-2', index: 2, isPublic: true, stdin: '21', expectedOutput: '42' },
        { id: 'tc-3', index: 3, isPublic: false, stdin: '100', expectedOutput: '200' }
      ];

      const outcome = await executeSuiteInSandbox({
        language: 'python',
        code: pyCode,
        testCases,
        timeoutMs: 2000
      });

      expect(outcome.verdict).toBe('ACCEPTED');
      expect(outcome.passedCount).toBe(3);
      expect(outcome.totalCount).toBe(3);
      expect(outcome.testResults[0].actualOutput).toBe('10\n');
      expect(outcome.testResults[2].actualOutput).toBe('[HIDDEN]');
      expect(outcome.testResults[2].passed).toBe(true);
    });

    it('should compile C++ ONCE and execute entire suite with ultra-fast execution', async () => {
      const cppCode = `
#include <iostream>
int main() {
    int x;
    if (std::cin >> x) {
        std::cout << (x * x) << std::endl;
    }
    return 0;
}
`;
      const testCases = [
        { id: 'tc-1', index: 1, isPublic: true, stdin: '3', expectedOutput: '9' },
        { id: 'tc-2', index: 2, isPublic: true, stdin: '4', expectedOutput: '16' },
        { id: 'tc-3', index: 3, isPublic: true, stdin: '5', expectedOutput: '25' },
        { id: 'tc-4', index: 4, isPublic: true, stdin: '6', expectedOutput: '36' },
        { id: 'tc-5', index: 5, isPublic: false, stdin: '7', expectedOutput: '49' }
      ];

      const startTime = performance.now();
      const outcome = await executeSuiteInSandbox({
        language: 'cpp',
        code: cppCode,
        testCases,
        timeoutMs: 2000
      });
      const elapsed = performance.now() - startTime;

      expect(outcome.verdict).toBe('ACCEPTED');
      expect(outcome.passedCount).toBe(5);
      expect(outcome.totalCount).toBe(5);
      // All 5 test cases including compilation should complete in under 1.5 seconds
      expect(elapsed).toBeLessThan(1500);
    });

    it('should short-circuit immediately on first failing test case (LeetCode behavior)', async () => {
      const pyCode = `
import sys
line = sys.stdin.read().strip()
# Passes test 1 (5 -> 10), fails test 2 (21 -> 999 instead of 42)
if line == '5':
    print('10')
else:
    print('999')
`;
      const testCases = [
        { id: 'tc-1', index: 1, isPublic: true, stdin: '5', expectedOutput: '10' },
        { id: 'tc-2', index: 2, isPublic: true, stdin: '21', expectedOutput: '42' },
        { id: 'tc-3', index: 3, isPublic: false, stdin: '100', expectedOutput: '200' },
        { id: 'tc-4', index: 4, isPublic: false, stdin: '500', expectedOutput: '1000' }
      ];

      const progressSteps: number[] = [];
      const outcome = await executeSuiteInSandbox({
        language: 'python',
        code: pyCode,
        testCases,
        shortCircuitOnFailure: true,
        onProgress: ({ current }) => {
          progressSteps.push(current);
        }
      });

      expect(outcome.verdict).toBe('WRONG_ANSWER');
      expect(outcome.passedCount).toBe(1);
      expect(outcome.totalCount).toBe(4);

      // Only test 1 and test 2 should have been executed before short-circuit
      expect(progressSteps).toEqual([1, 2]);

      // Test 1 passed
      expect(outcome.testResults[0].passed).toBe(true);
      // Test 2 failed
      expect(outcome.testResults[1].passed).toBe(false);
      // Test 3 and 4 were skipped
      expect(outcome.testResults[2].errorMessage).toContain('Skipped');
      expect(outcome.testResults[3].errorMessage).toContain('Skipped');
    });

    it('should abort immediately on C++ compilation error without executing test cases', async () => {
      const brokenCpp = `
#include <iostream>
int main() {
    this_does_not_exist();
    return 0;
}
`;
      const testCases = [
        { id: 'tc-1', index: 1, isPublic: true, stdin: '1', expectedOutput: '1' },
        { id: 'tc-2', index: 2, isPublic: true, stdin: '2', expectedOutput: '2' }
      ];

      let progressCalled = false;
      const outcome = await executeSuiteInSandbox({
        language: 'cpp',
        code: brokenCpp,
        testCases,
        onProgress: () => {
          progressCalled = true;
        }
      });

      expect(outcome.verdict).toBe('COMPILATION_ERROR');
      expect(outcome.compileOutput).toContain('this_does_not_exist');
      expect(progressCalled).toBe(false);
      expect(outcome.passedCount).toBe(0);
    });
  });
});
