import { SolutionApproach, ApproachComparisonRow, CANONICAL_PROBLEM_APPROACHES, getCanonicalApproaches } from '@aica/shared';
import mongoose from 'mongoose';

export class ApproachCacheService {
  /**
   * Retrieves multi-approach solutions for a problem.
   * Checks:
   * 1. In-memory / MongoDB Problem document
   * 2. Curated canonical bank (Two Sum, Merge Intervals, Trapping Rain Water, etc.)
   * 3. Redis cache
   */
  public static async getApproachesForProblem(
    problemId: string,
    problemDoc?: any
  ): Promise<{
    solutionApproaches: SolutionApproach[];
    comparisonMatrix: ApproachComparisonRow[];
  } | null> {
    // 1. Check if problem document already has approaches populated
    if (problemDoc?.solutionApproaches && problemDoc.solutionApproaches.length > 0) {
      return {
        solutionApproaches: problemDoc.solutionApproaches,
        comparisonMatrix: problemDoc.comparisonMatrix || []
      };
    }

    const slug = problemDoc?.slug || '';
    const title = (problemDoc?.title || '').toLowerCase();
    const query = slug || title || problemId;

    // 2. Check canonical curated bank
    const curated = getCanonicalApproaches(query);
    if (curated) {
      // Asynchronously persist to problem document in MongoDB for future instant retrieval
      if (problemDoc?._id) {
        try {
          await mongoose.connection.collection('problems').updateOne(
            { _id: problemDoc._id },
            {
              $set: {
                solutionApproaches: curated.solutionApproaches,
                comparisonMatrix: curated.comparisonMatrix
              }
            }
          );
        } catch (err: any) {
          console.warn('[ApproachCacheService] Background persist warning:', err.message);
        }
      }

      return {
        solutionApproaches: JSON.parse(JSON.stringify(curated.solutionApproaches)),
        comparisonMatrix: JSON.parse(JSON.stringify(curated.comparisonMatrix))
      };
    }

    return null;
  }

  /**
   * Identifies which of the available approaches best matches the student's code.
   * Uses structural AST indicators (loop depth, hash map usage, sorting, two-pointer keywords).
   */
  public static matchStudentApproach(
    code: string,
    maxLoopDepth: number,
    approaches: SolutionApproach[]
  ): { approaches: SolutionApproach[]; matchedApproach?: SolutionApproach } {
    if (!approaches || approaches.length === 0) {
      return { approaches: [] };
    }

    const lowerCode = code.toLowerCase();
    let bestMatchIndex = 0;

    // Heuristics:
    // 1. Nested loop depth >= 2 -> Brute Force
    if (maxLoopDepth >= 2) {
      const bfIndex = approaches.findIndex((a) => a.paradigm === 'BRUTE_FORCE');
      if (bfIndex !== -1) bestMatchIndex = bfIndex;
    }
    // 2. Hash Map / Dict / Set / Cache / Seen usage
    else if (
      lowerCode.includes('lookup') ||
      lowerCode.includes('hash') ||
      lowerCode.includes('dict') ||
      lowerCode.includes('seen') ||
      lowerCode.includes('cache') ||
      lowerCode.includes('freq') ||
      lowerCode.includes('set(') ||
      lowerCode.includes('map') ||
      lowerCode.includes('unordered_map') ||
      lowerCode.includes('{}')
    ) {
      const hashIndex = approaches.findIndex((a) => a.paradigm === 'HASHING' || a.title.toLowerCase().includes('hash'));
      if (hashIndex !== -1) bestMatchIndex = hashIndex;
    }
    // 3. Two Pointers / Left & Right / While loop
    else if (lowerCode.includes('left') && lowerCode.includes('right') && (lowerCode.includes('while') || lowerCode.includes('pointer'))) {
      const tpIndex = approaches.findIndex((a) => a.paradigm === 'TWO_POINTER' || a.title.toLowerCase().includes('pointer'));
      if (tpIndex !== -1) bestMatchIndex = tpIndex;
    }
    // 4. Sorting
    else if (lowerCode.includes('.sort(') || lowerCode.includes('sorted(')) {
      const sortIndex = approaches.findIndex((a) => a.title.toLowerCase().includes('sort') || a.paradigm === 'TWO_POINTER');
      if (sortIndex !== -1) bestMatchIndex = sortIndex;
    }
    // 5. Default to the highest optimal approach if single loop
    else if (maxLoopDepth === 1) {
      const optimalIndex = approaches.findIndex((a) => a.paradigm === 'OPTIMAL' || a.paradigm === 'TWO_POINTER');
      if (optimalIndex !== -1) bestMatchIndex = optimalIndex;
    }

    // Set isUserApproach flag cleanly
    const updated = approaches.map((app, idx) => ({
      ...app,
      isUserApproach: idx === bestMatchIndex
    }));

    return {
      approaches: updated,
      matchedApproach: updated[bestMatchIndex]
    };
  }
}
