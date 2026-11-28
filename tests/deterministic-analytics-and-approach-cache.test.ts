import { describe, it, expect } from 'vitest';
import {
  StaticCodeAnalyzer,
  PercentileCalculator
} from '../apps/worker/src/services/deterministic-analytics.service.js';
import { ApproachCacheService } from '../apps/worker/src/services/approach-cache.service.js';
import { getCanonicalApproaches, CANONICAL_PROBLEM_APPROACHES } from '../packages/shared/dist/index.js';

describe('Deterministic Analytics & Static Code Analyzer', () => {
  it('should analyze single linear loop (depth 1) with low complexity and high quality grade', () => {
    const pythonCode = `
def merge(intervals):
    if not intervals:
        return []
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for current in intervals[1:]:
        if current[0] <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], current[1])
        else:
            merged.append(current)
    return merged
`;
    const result = StaticCodeAnalyzer.analyze({
      code: pythonCode,
      language: 'python',
      executionTimeMs: 24,
      memoryUsedKb: 16672
    });

    expect(result.maxLoopDepth).toBe(1);
    expect(result.cyclomaticComplexity).toBeGreaterThanOrEqual(2);
    expect(result.qualityScore).toBeGreaterThanOrEqual(80);
    expect(['A+', 'A']).toContain(result.qualityGrade);
    expect(result.positivePatterns).toEqual(
      expect.arrayContaining([expect.stringContaining('Single linear loop')])
    );
    expect(result.codeSmells).toHaveLength(0);
  });

  it('should detect nested loops (depth 2) and flag quadratic O(N^2) code smell with score penalty', () => {
    const bruteForcePython = `
def two_sum_brute(nums, target):
    n = len(nums)
    for i in range(n):
        for j in range(i + 1, n):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []
`;
    const result = StaticCodeAnalyzer.analyze({
      code: bruteForcePython,
      language: 'python',
      executionTimeMs: 150,
      memoryUsedKb: 18000
    });

    expect(result.maxLoopDepth).toBe(2);
    expect(result.codeSmells.some((s) => s.includes('Nested loop detected'))).toBe(true);
    expect(result.qualityScore).toBeLessThan(90);
  });

  it('should analyze braces-based languages (JavaScript/C++) loop depth accurately', () => {
    const jsCode = `
function containsDuplicate(nums) {
    const seen = new Set();
    for (let i = 0; i < nums.length; i++) {
        if (seen.has(nums[i])) {
            return true;
        }
        seen.add(nums[i]);
    }
    return false;
}
`;
    const result = StaticCodeAnalyzer.analyze({
      code: jsCode,
      language: 'javascript',
      executionTimeMs: 18,
      memoryUsedKb: 12000
    });

    expect(result.maxLoopDepth).toBe(1);
    expect(result.qualityGrade).toBe('A+');
    expect(result.positivePatterns.some((p) => p.includes('hash-based'))).toBe(true);
  });

  it('should classify two-pointer monotonic while loops (Valid Palindrome) as O(N) depth 1 instead of false O(N^2)', () => {
    const validPalindromePy = `
def isPalindrome(s: str) -> bool:
    left, right = 0, len(s) - 1
    while left < right:
        while left < right and not s[left].isalnum():
            left += 1
        while left < right and not s[right].isalnum():
            right -= 1
        if s[left].lower() != s[right].lower():
            return False
        left += 1
        right -= 1
    return True
`;
    const result = StaticCodeAnalyzer.analyze({
      code: validPalindromePy,
      language: 'python',
      executionTimeMs: 12,
      memoryUsedKb: 14000,
      verdict: 'ACCEPTED',
      passedCount: 5,
      totalCount: 5
    });

    expect(result.maxLoopDepth).toBe(1);
    expect(result.codeSmells.some((s) => s.includes('Nested loop detected'))).toBe(false);
    expect(result.positivePatterns.some((p) => p.includes('Two-pointer monotonic linear scan'))).toBe(true);
    expect(['A+', 'A']).toContain(result.qualityGrade);
  });

  it('should cap qualityScore and avoid Grade A when verdict is RUNTIME_ERROR or failing', () => {
    const result = StaticCodeAnalyzer.analyze({
      code: 'def solve(s):\n    left, right = 0, len(s) - 1\n    while left < right:\n        left += 1\n',
      language: 'python',
      executionTimeMs: 15,
      memoryUsedKb: 12000,
      verdict: 'RUNTIME_ERROR',
      passedCount: 2,
      totalCount: 4
    });

    expect(result.qualityScore).toBeLessThanOrEqual(65);
    expect(['C', 'NEEDS_REFACTOR']).toContain(result.qualityGrade);
    expect(result.codeSmells.some((s) => s.includes('RUNTIME_ERROR'))).toBe(true);
  });

  it('should track brace-language loop depth accurately across inner if blocks and estimate space complexity', () => {
    const jsNestedWithIf = `
function pairs(nums) {
    const out = [];
    for (let i = 0; i < nums.length; i++) {
        if (nums[i] > 0) {
            out.push(nums[i]);
        }
        for (let j = i + 1; j < nums.length; j++) {
            if (nums[i] === nums[j]) return true;
        }
    }
    return false;
}
`;
    const result = StaticCodeAnalyzer.analyze({
      code: jsNestedWithIf,
      language: 'javascript',
      executionTimeMs: 25,
      memoryUsedKb: 15000
    });

    expect(result.maxLoopDepth).toBe(2);
    expect(StaticCodeAnalyzer.estimateSpaceComplexity(jsNestedWithIf, 'javascript')).toBe('O(N) (Est.)');
    expect(StaticCodeAnalyzer.estimateSpaceComplexity('def f(n):\n    l, r = 0, len(n)-1\n    return l', 'python')).toBe('O(1) (Est.)');
  });
});

describe('Percentile Analytics Calculator', () => {
  it('should compute mathematical percentiles correctly against historical submissions', () => {
    const historicalTimes = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const historicalMemories = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];

    // User time 20ms: faster than 80% of submissions
    const res = PercentileCalculator.calculatePercentiles(20, 2000, historicalTimes, historicalMemories);
    expect(res.runtimePercentile).toBe(85.0);
    expect(res.memoryPercentile).toBe(85.0);

    // Fastest user: 5ms
    const fastest = PercentileCalculator.calculatePercentiles(5, 500, historicalTimes, historicalMemories);
    expect(fastest.runtimePercentile).toBeGreaterThanOrEqual(95);
    expect(fastest.memoryPercentile).toBeGreaterThanOrEqual(95);

    // Slowest user: 120ms
    const slowest = PercentileCalculator.calculatePercentiles(120, 12000, historicalTimes, historicalMemories);
    expect(slowest.runtimePercentile).toBeLessThanOrEqual(10);
    expect(slowest.memoryPercentile).toBeLessThanOrEqual(10);
  });

  it('should return safe default baseline when insufficient historical data exists', () => {
    const res = PercentileCalculator.calculatePercentiles(24, 16000, [], []);
    expect(res.runtimePercentile).toBe(92.5);
    expect(res.memoryPercentile).toBe(88.0);
  });
});

describe('Canonical Approaches & Heuristic AST Matching', () => {
  it('should provide canonical curated approaches for core problems', () => {
    const mergeData = getCanonicalApproaches('merge-intervals');
    expect(mergeData).not.toBeNull();
    expect(mergeData!.solutionApproaches.length).toBeGreaterThanOrEqual(3);
    expect(mergeData!.comparisonMatrix.length).toBeGreaterThanOrEqual(3);

    const trapData = getCanonicalApproaches('trapping-rain-water');
    expect(trapData).not.toBeNull();
    expect(trapData!.solutionApproaches.some((a) => a.paradigm === 'TWO_POINTER')).toBe(true);

    const twoSumData = getCanonicalApproaches('two-sum-optimal');
    expect(twoSumData).not.toBeNull();
    expect(twoSumData!.solutionApproaches.some((a) => a.paradigm === 'HASHING')).toBe(true);
  });

  it('should match student approach via AST heuristics accurately', () => {
    const approaches = [
      {
        approachNumber: 1,
        title: 'Brute Force Nested Loops',
        paradigm: 'BRUTE_FORCE',
        isUserApproach: false,
        timeComplexity: 'O(N^2)',
        spaceComplexity: 'O(1)',
        intuition: '',
        pros: [],
        cons: []
      },
      {
        approachNumber: 2,
        title: 'Two Pointers with Sorting',
        paradigm: 'TWO_POINTER',
        isUserApproach: false,
        timeComplexity: 'O(N log N)',
        spaceComplexity: 'O(1)',
        intuition: '',
        pros: [],
        cons: []
      },
      {
        approachNumber: 3,
        title: 'Single-Pass Hash Map',
        paradigm: 'HASHING',
        isUserApproach: false,
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        intuition: '',
        pros: [],
        cons: []
      }
    ];

    // Case 1: Student uses nested loop
    const bfMatch = ApproachCacheService.matchStudentApproach('for i in range(n):\n    for j in range(i+1, n):', 2, approaches);
    expect(bfMatch.matchedApproach?.paradigm).toBe('BRUTE_FORCE');
    expect(bfMatch.approaches.find((a) => a.paradigm === 'BRUTE_FORCE')?.isUserApproach).toBe(true);

    // Case 2: Student uses hash map / dictionary lookup
    const hashMatch = ApproachCacheService.matchStudentApproach('seen = {}\nfor i, x in enumerate(nums):\n    if target - x in seen: return [seen[target - x], i]\n    seen[x] = i', 1, approaches);
    expect(hashMatch.matchedApproach?.paradigm).toBe('HASHING');
    expect(hashMatch.approaches.find((a) => a.paradigm === 'HASHING')?.isUserApproach).toBe(true);

    // Case 3: Student uses two pointers
    const tpMatch = ApproachCacheService.matchStudentApproach('left = 0\nright = len(nums) - 1\nwhile left < right:\n    if nums[left] + nums[right] == target:\n        return [left, right]', 1, approaches);
    expect(tpMatch.matchedApproach?.paradigm).toBe('TWO_POINTER');
    expect(tpMatch.approaches.find((a) => a.paradigm === 'TWO_POINTER')?.isUserApproach).toBe(true);
  });
});
