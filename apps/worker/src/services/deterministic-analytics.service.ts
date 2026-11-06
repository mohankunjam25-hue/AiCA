import { SupportedLanguage, DeterministicAnalytics } from '@aica/shared';

export interface CodeAnalysisInput {
  code: string;
  language: SupportedLanguage | string;
  executionTimeMs: number;
  memoryUsedKb: number;
}

export class StaticCodeAnalyzer {
  /**
   * Deterministically analyze source code without any AI / external API.
   * Calculates loop depth, cyclomatic complexity, code smells, and quality score.
   */
  public static analyze(input: CodeAnalysisInput): Omit<DeterministicAnalytics, 'runtimePercentile' | 'memoryPercentile'> {
    const { code, language } = input;
    const lines = code.split('\n');

    let maxLoopDepth = 0;
    let currentDepth = 0;
    let cyclomaticComplexity = 1; // base complexity
    const codeSmells: string[] = [];
    const positivePatterns: string[] = [];

    // Language-specific patterns
    const isPython = language.toLowerCase() === 'python';
    const isBraceLang = ['javascript', 'cpp', 'java'].includes(language.toLowerCase());

    // Loop detection patterns
    const forRegex = /\bfor\b/;
    const whileRegex = /\bwhile\b/;
    const branchRegex = /\b(if|elif|else\s+if|switch|case|catch|\?\s*:)\b/;
    const logicalOperatorRegex = /(&&|\|\||\band\b|\bor\b)/g;

    // Track indentation for Python
    const indentStack: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
        continue;
      }

      // 1. Branch / Cyclomatic Complexity Counting
      if (branchRegex.test(trimmed)) {
        cyclomaticComplexity++;
      }
      const logicalMatches = trimmed.match(logicalOperatorRegex);
      if (logicalMatches) {
        cyclomaticComplexity += logicalMatches.length;
      }

      // 2. Loop Nesting Depth Analysis
      if (isPython) {
        const indent = line.search(/\S/);
        while (indentStack.length > 0 && indent <= indentStack[indentStack.length - 1]) {
          indentStack.pop();
        }

        if (forRegex.test(trimmed) || whileRegex.test(trimmed)) {
          indentStack.push(indent);
          maxLoopDepth = Math.max(maxLoopDepth, indentStack.length);
        }
      } else if (isBraceLang) {
        if (forRegex.test(trimmed) || whileRegex.test(trimmed)) {
          currentDepth++;
          maxLoopDepth = Math.max(maxLoopDepth, currentDepth);
        }
        if (trimmed.includes('}')) {
          const closes = (trimmed.match(/}/g) || []).length;
          currentDepth = Math.max(0, currentDepth - closes);
        }
      }
    }

    // Fallback if no loop was detected (e.g. recursion, math, or single operation)
    maxLoopDepth = Math.max(maxLoopDepth, 0);

    // 3. Code Smells & Patterns Identification
    let penalty = 0;

    // Nested loops smell
    if (maxLoopDepth >= 2) {
      codeSmells.push(`Nested loop detected (Depth: ${maxLoopDepth}). May cause quadratic O(N^${maxLoopDepth}) scaling.`);
      penalty += 15 * (maxLoopDepth - 1);
    } else if (maxLoopDepth === 1) {
      positivePatterns.push('Single linear loop pass O(N) structural traversal.');
    } else {
      positivePatterns.push('Sub-linear / In-place constant or logarithmic flow.');
    }

    // High complexity smell
    if (cyclomaticComplexity > 8) {
      codeSmells.push(`High branching complexity (${cyclomaticComplexity}). Refactor nested logic into smaller functions.`);
      penalty += Math.min(25, (cyclomaticComplexity - 8) * 3);
    } else {
      positivePatterns.push('Low cognitive complexity and clean branching logic.');
    }

    // Single-letter variable names smell (excluding standard i, j, k, x, y, n, m)
    const varMatches = code.match(/\b([a-zA-Z])\s*=\s*/g);
    if (varMatches && varMatches.length > 5) {
      codeSmells.push('Multiple single-letter variable names. Use descriptive variable naming.');
      penalty += 5;
    } else {
      positivePatterns.push('Readable variable naming conventions.');
    }

    // Long code without functions
    if (lines.length > 50 && !code.includes('def ') && !code.includes('function ') && !code.includes('class ')) {
      codeSmells.push('Monolithic script structure. Break down into modular helper functions.');
      penalty += 10;
    }

    // Check for useful idioms
    if (code.includes('enumerate(') || code.includes('zip(')) {
      positivePatterns.push('Uses idiomatic Python iteration (enumerate/zip).');
    }
    if (code.includes('dict') || code.includes('set') || code.includes('Map') || code.includes('Set') || code.includes('unordered_map')) {
      positivePatterns.push('Employs hash-based auxiliary data structures for fast O(1) lookups.');
    }

    // Calculate Quality Score (1 to 100)
    const qualityScore = Math.max(30, Math.min(100, 100 - penalty));

    // Quality Grade
    let qualityGrade: 'A+' | 'A' | 'B' | 'C' | 'NEEDS_REFACTOR' = 'A';
    if (qualityScore >= 92) qualityGrade = 'A+';
    else if (qualityScore >= 82) qualityGrade = 'A';
    else if (qualityScore >= 70) qualityGrade = 'B';
    else if (qualityScore >= 55) qualityGrade = 'C';
    else qualityGrade = 'NEEDS_REFACTOR';

    return {
      cyclomaticComplexity,
      maxLoopDepth,
      qualityScore,
      qualityGrade,
      codeSmells,
      positivePatterns
    };
  }
}

export class PercentileCalculator {
  /**
   * Deterministically calculate runtime and memory percentiles
   * based on all accepted historical submissions for this problem.
   */
  public static calculatePercentiles(
    userTimeMs: number,
    userMemoryKb: number,
    allAcceptedTimes: number[],
    allAcceptedMemories: number[]
  ): { runtimePercentile: number; memoryPercentile: number } {
    if (!allAcceptedTimes || allAcceptedTimes.length <= 1) {
      // Optimal default baseline when insufficient historical submissions exist
      return { runtimePercentile: 92.5, memoryPercentile: 88.0 };
    }

    // Slower count: solutions that took MORE time than the user
    const slowerTimeCount = allAcceptedTimes.filter((t) => t > userTimeMs).length;
    const sameTimeCount = allAcceptedTimes.filter((t) => t === userTimeMs).length;
    const rawTimePercentile = ((slowerTimeCount + 0.5 * sameTimeCount) / allAcceptedTimes.length) * 100;
    const runtimePercentile = Math.max(5.0, Math.min(99.5, Math.round(rawTimePercentile * 10) / 10));

    // Higher memory count: solutions that used MORE memory than the user
    const higherMemCount = allAcceptedMemories.filter((m) => m > userMemoryKb).length;
    const sameMemCount = allAcceptedMemories.filter((m) => m === userMemoryKb).length;
    const rawMemPercentile = ((higherMemCount + 0.5 * sameMemCount) / allAcceptedMemories.length) * 100;
    const memoryPercentile = Math.max(5.0, Math.min(99.5, Math.round(rawMemPercentile * 10) / 10));

    return {
      runtimePercentile,
      memoryPercentile
    };
  }
}
