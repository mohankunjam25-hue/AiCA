import { SupportedLanguage, DeterministicAnalytics, Verdict } from '@aica/shared';

export interface CodeAnalysisInput {
  code: string;
  language: SupportedLanguage | string;
  executionTimeMs: number;
  memoryUsedKb: number;
  verdict?: Verdict;
  passedCount?: number;
  totalCount?: number;
}

const LOOP_START_REGEX = /^\s*(for|while)\b/;
const POINTER_CONDITION_REGEX = /\b([a-zA-Z_]\w*)\s*(?:<=|>=|<|>|!=)\s*([a-zA-Z_]\w*)/g;

function extractComparisonIdentifiers(line: string): string[] {
  const vars = new Set<string>();
  const matches = line.matchAll(POINTER_CONDITION_REGEX);
  for (const m of matches) {
    if (m[1]) vars.add(m[1]);
    if (m[2]) vars.add(m[2]);
  }
  return Array.from(vars);
}

function isMonotonicInnerWhile(
  outerHeader: string,
  innerHeader: string
): boolean {
  if (!/^\s*while\b/.test(outerHeader) || !/^\s*while\b/.test(innerHeader)) {
    return false;
  }
  const outerVars = extractComparisonIdentifiers(outerHeader);
  const innerVars = extractComparisonIdentifiers(innerHeader);
  if (outerVars.length < 2 || innerVars.length === 0) return false;
  // Inner while checks the same pointer/boundary variables as outer while (e.g. while left < right inside while left < right)
  const shared = innerVars.filter((v) => outerVars.includes(v));
  return shared.length >= 2;
}

export class StaticCodeAnalyzer {
  /**
   * Estimate space complexity deterministically via auxiliary allocation patterns.
   */
  public static estimateSpaceComplexity(code: string, language: string): string {
    const cleaned = code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/#.*$/gm, '');

    const hasAuxCollection =
      /\b(dict|set|Counter|defaultdict|deque|OrderedDict|Map|Set|WeakMap|Array|vector|unordered_map|unordered_set|map|stack|queue|priority_queue|HashMap|HashSet|ArrayList|LinkedList|Stack|Queue|StringBuilder)\b/.test(
        cleaned
      ) ||
      /=\s*(\[\s*.*\]|\{\s*\})/.test(cleaned) ||
      /\.append\s*\(|\.push\s*\(|\.add\s*\(|new\s+\w+\s*\[/.test(cleaned);

    if (hasAuxCollection) {
      return 'O(N) (Est.)';
    }
    if (language.toLowerCase() === 'python' || language.toLowerCase() === 'javascript') {
      return 'O(1) (Est.)';
    }
    return 'O(1) (Est.)';
  }

  /**
   * Deterministically analyze source code without any AI / external API.
   * Calculates loop depth, cyclomatic complexity, code smells, and quality score.
   */
  public static analyze(input: CodeAnalysisInput): Omit<DeterministicAnalytics, 'runtimePercentile' | 'memoryPercentile'> {
    const { code, language, verdict, passedCount, totalCount } = input;
    const lines = code.split('\n');

    let maxLoopDepth = 0;
    let cyclomaticComplexity = 1; // base complexity
    let detectedTwoPointerScan = false;
    const codeSmells: string[] = [];
    const positivePatterns: string[] = [];

    // Language-specific patterns
    const isPython = language.toLowerCase() === 'python';
    const isBraceLang = ['javascript', 'cpp', 'java'].includes(language.toLowerCase());

    const forRegex = /\bfor\b/;
    const whileRegex = /\bwhile\b/;
    const branchRegex = /\b(if|elif|else\s+if|switch|case|catch|\?\s*:)\b/;
    const logicalOperatorRegex = /(&&|\|\||\band\b|\bor\b)/g;

    // Track indentation for Python
    const pyLoopStack: Array<{ indent: number; header: string; monotonic: boolean }> = [];
    // Track brace blocks for JS/C++/Java
    const braceBlockStack: Array<{ isLoop: boolean; monotonic: boolean; header: string }> = [];
    let pendingBraceLoop: { header: string } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
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
        while (pyLoopStack.length > 0 && indent <= pyLoopStack[pyLoopStack.length - 1].indent) {
          pyLoopStack.pop();
        }

        if (LOOP_START_REGEX.test(trimmed)) {
          const parentLoop = pyLoopStack.length > 0 ? pyLoopStack[pyLoopStack.length - 1] : null;
          const isMonotonic = Boolean(parentLoop && isMonotonicInnerWhile(parentLoop.header, trimmed));
          if (isMonotonic) {
            detectedTwoPointerScan = true;
          }
          pyLoopStack.push({ indent, header: trimmed, monotonic: isMonotonic });
          const effectiveDepth = pyLoopStack.filter((l) => !l.monotonic).length;
          maxLoopDepth = Math.max(maxLoopDepth, effectiveDepth);
        }
      } else if (isBraceLang) {
        // Strip quoted strings before scanning braces
        const codeOnly = trimmed.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, '');
        if (forRegex.test(codeOnly) || whileRegex.test(codeOnly)) {
          pendingBraceLoop = { header: codeOnly };
        }

        for (let c = 0; c < codeOnly.length; c++) {
          const ch = codeOnly[c];
          if (ch === '{') {
            if (pendingBraceLoop) {
              const parentLoop = [...braceBlockStack].reverse().find((b) => b.isLoop);
              const isMonotonic = Boolean(
                parentLoop && isMonotonicInnerWhile(parentLoop.header, pendingBraceLoop.header)
              );
              if (isMonotonic) {
                detectedTwoPointerScan = true;
              }
              braceBlockStack.push({
                isLoop: true,
                monotonic: isMonotonic,
                header: pendingBraceLoop.header
              });
              pendingBraceLoop = null;
              const effectiveDepth = braceBlockStack.filter((b) => b.isLoop && !b.monotonic).length;
              maxLoopDepth = Math.max(maxLoopDepth, effectiveDepth);
            } else {
              braceBlockStack.push({ isLoop: false, monotonic: false, header: '' });
            }
          } else if (ch === '}') {
            if (braceBlockStack.length > 0) {
              braceBlockStack.pop();
            }
          }
        }
      }
    }

    maxLoopDepth = Math.max(maxLoopDepth, 0);

    // 3. Code Smells & Patterns Identification
    let penalty = 0;

    if (maxLoopDepth >= 2) {
      codeSmells.push(`Nested loop detected (Depth: ${maxLoopDepth}). May cause quadratic O(N^${maxLoopDepth}) scaling.`);
      penalty += 15 * (maxLoopDepth - 1);
    } else if (detectedTwoPointerScan) {
      positivePatterns.push('Two-pointer monotonic linear scan O(N).');
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

    // Calculate Quality Score (1 to 100) with mandatory verdict gate
    let qualityScore = Math.max(30, Math.min(100, 100 - penalty));

    if (verdict && verdict !== 'ACCEPTED') {
      const hasCounts = typeof passedCount === 'number' && typeof totalCount === 'number' && totalCount > 0;
      const passRatio = hasCounts ? passedCount / totalCount : 0;
      if (verdict === 'COMPILATION_ERROR') {
        qualityScore = 20;
      } else {
        // Crashed or failing code must NEVER receive an A/A+ grade (capped strictly <= 65)
        qualityScore = Math.min(qualityScore, Math.round(30 + passRatio * 35));
      }
      codeSmells.unshift(
        hasCounts
          ? `Verification failed (${verdict}: ${passedCount}/${totalCount} test cases passed).`
          : `Verification failed with ${verdict}.`
      );
    }

    // Quality Grade
    let qualityGrade: 'A+' | 'A' | 'B' | 'C' | 'NEEDS_REFACTOR' = 'A';
    if (qualityScore >= 92) qualityGrade = 'A+';
    else if (qualityScore >= 82) qualityGrade = 'A';
    else if (qualityScore >= 70) qualityGrade = 'B';
    else if (qualityScore >= 50) qualityGrade = 'C';
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
