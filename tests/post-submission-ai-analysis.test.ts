import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiAnalysisClient } from '@aica/ai-engine';
import { AiEvaluatorService, AiEvaluationContext } from '../apps/worker/src/services/ai-evaluator.service.js';
import { getSubmissionAiAnalysis } from '../apps/api/src/controllers/submission.controller.js';
import { SubmissionModel } from '../apps/api/src/models/mongodb/submission.model.js';
import { EvaluationReportModel } from '../apps/api/src/models/mongodb/evaluation-report.model.js';
import { Request, Response } from 'express';

class MockCollection {
  private data: Map<string, any> = new Map();

  constructor(initialData: any[] = []) {
    for (const item of initialData) {
      this.data.set(item._id.toString(), { ...item });
    }
  }

  async findOne(query: any) {
    if (query._id) {
      const id = query._id.toString ? query._id.toString() : String(query._id);
      return this.data.get(id) || null;
    }
    if (query.submissionId) {
      for (const item of this.data.values()) {
        if (item.submissionId === query.submissionId) return { ...item };
      }
      return null;
    }
    return null;
  }

  async updateOne(filter: any, update: any) {
    const id = filter._id ? (filter._id.toString ? filter._id.toString() : String(filter._id)) : null;
    let target = id ? this.data.get(id) : null;

    if (!target && filter.submissionId) {
      for (const item of this.data.values()) {
        if (item.submissionId === filter.submissionId) {
          target = item;
          break;
        }
      }
    }

    if (target && update.$set) {
      Object.assign(target, update.$set);
      return { modifiedCount: 1 };
    }
    return { modifiedCount: 0 };
  }

  async insertOne(doc: any) {
    const id = doc._id ? doc._id.toString() : `mock_${Date.now()}_${Math.random()}`;
    const stored = { ...doc, _id: id };
    this.data.set(id, stored);
    return { insertedId: id };
  }

  get(id: string) {
    return this.data.get(id);
  }
}

describe('Post-Submission AI Code Analysis & Multi-Approach Engine', () => {
  const sampleSubmissionId = '654321654321654321654321';
  const sampleProblemId = '123456123456123456123456';

  let mockSubmissionsCol: MockCollection;
  let mockProblemsCol: MockCollection;
  let mockReportsCol: MockCollection;
  let mockDb: any;

  beforeEach(() => {
    vi.restoreAllMocks();

    mockSubmissionsCol = new MockCollection([
      {
        _id: sampleSubmissionId,
        problemId: sampleProblemId,
        userId: 'user_dev_101',
        username: 'algo_pro',
        language: 'python',
        code: 'def twoSum(nums, target):\n    lookup = {}\n    for i, num in enumerate(nums):\n        if target - num in lookup:\n            return [lookup[target - num], i]\n        lookup[num] = i\n    return []',
        pipelineStatus: 'COMPLETED',
        verdict: 'ACCEPTED',
        executionTimeMs: 35,
        memoryUsedKb: 14200,
        compositeScore: 92,
        testCasesTotal: 5,
        testCasesPassed: 5,
        testResults: []
      }
    ]);

    mockProblemsCol = new MockCollection([
      {
        _id: sampleProblemId,
        title: 'Two Sum',
        description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
        timeLimitMs: 2000,
        memoryLimitKb: 262144
      }
    ]);

    mockReportsCol = new MockCollection([
      {
        _id: 'report_initial_1',
        submissionId: sampleSubmissionId,
        userId: 'user_dev_101',
        username: 'algo_pro',
        problemId: sampleProblemId,
        verdict: 'ACCEPTED',
        pipelineStatus: 'COMPLETED',
        summary: 'Evaluated 5 test cases. Verdict: ACCEPTED.',
        aiAnalysis: {
          status: 'PENDING',
          mode: 'OPTIMIZATION'
        },
        metrics: { rawTimeMs: 35, normalizedTimeMs: 35, rawMemoryKb: 14200, normalizedMemoryKb: 14200, compositeScore: 92 }
      }
    ]);

    mockDb = {
      collection: (name: string) => {
        if (name === 'submissions') return mockSubmissionsCol;
        if (name === 'problems') return mockProblemsCol;
        if (name === 'evaluation_reports') return mockReportsCol;
        return new MockCollection();
      }
    };
  });

  describe('1. Decoupled AI Pipeline: Zero AI in Hot Path & Trigger on ACCEPTED', () => {
    it('should generate deep code review and multi-approach taxonomy for ACCEPTED submission', async () => {
      const mockAiClient = {
        analyzeAcceptedSolution: vi.fn().mockResolvedValue({
          status: 'COMPLETED',
          mode: 'OPTIMIZATION',
          codeSummary: 'Single-pass hash table mapping complements for O(N) lookup.',
          theoreticalComplexity: {
            timeComplexity: 'O(N)',
            spaceComplexity: 'O(N)',
            explanation: 'Single traversal through array with O(1) hash map operations.'
          },
          codeQuality: {
            score: 9,
            qualityGrade: 'A+',
            overallScore: 95,
            readabilityAnalysis: 'Clean idiomatic Python with descriptive variable names.',
            codeSmells: [],
            positivePractices: ['Uses enumerate for clean indexing', 'Single-pass hash map']
          },
          optimizationSuggestions: [
            {
              title: 'Type hinting',
              rationale: 'Adding type annotations improves IDE autocompletion and maintainability.',
              expectedTimeImpact: 'Zero runtime overhead',
              refactoredSnippet: 'def twoSum(nums: list[int], target: int) -> list[int]:'
            }
          ],
          improvements: [
            {
              category: 'CLEAN_CODE',
              suggestion: 'Add docstrings and type annotations to adhere to PEP 8 standards.',
              codeSnippetBefore: 'def twoSum(nums, target):',
              codeSnippetAfter: 'def twoSum(nums: list[int], target: int) -> list[int]:'
            }
          ],
          solutionApproaches: [
            {
              approachNumber: 1,
              title: 'Brute Force Nested Loops',
              paradigm: 'BRUTE_FORCE',
              isUserApproach: false,
              timeComplexity: 'O(N^2)',
              spaceComplexity: 'O(1)',
              intuition: 'Check every pair of elements using two nested loops.',
              pros: ['Zero additional memory allocated', 'Easy to understand'],
              cons: ['Quadratic time complexity causes TLE on large constraints'],
              pseudoCodeOrGuide: 'for i in range(len(nums)): for j in range(i+1, len(nums)): ...'
            },
            {
              approachNumber: 2,
              title: 'Sorting with Two Pointers',
              paradigm: 'TWO_POINTER',
              isUserApproach: false,
              timeComplexity: 'O(N log N)',
              spaceComplexity: 'O(N)',
              intuition: 'Sort paired (num, original_index) and shrink window from both ends.',
              pros: ['Better than brute force, no hash collisions'],
              cons: ['Requires O(N) space to preserve original indices'],
              pseudoCodeOrGuide: 'sorted_pairs = sorted(...); left = 0, right = n-1; ...'
            },
            {
              approachNumber: 3,
              title: 'Single-Pass Hash Map (Optimal)',
              paradigm: 'HASHING',
              isUserApproach: true,
              timeComplexity: 'O(N)',
              spaceComplexity: 'O(N)',
              intuition: 'Check complement presence in lookup table while inserting current element.',
              pros: ['Optimal linear time O(N)', 'Only requires a single pass'],
              cons: ['O(N) auxiliary space for hash table'],
              pseudoCodeOrGuide: 'lookup = {}; for i, x in enumerate(nums): ...'
            }
          ],
          comparisonMatrix: [
            { approach: 'Brute Force', time: 'O(N^2)', space: 'O(1)', suitability: 'Small arrays (N <= 100)' },
            { approach: 'Two Pointers (Sorted)', time: 'O(N log N)', space: 'O(N)', suitability: 'When inputs are pre-sorted' },
            { approach: 'Single-Pass Hash Map', time: 'O(N)', space: 'O(N)', suitability: 'Industry standard, optimal runtime' }
          ],
          generatedAt: new Date().toISOString()
        })
      };

      const aiService = new AiEvaluatorService(mockAiClient as any);
      const ctx: AiEvaluationContext = {
        submissionId: sampleSubmissionId,
        problemId: sampleProblemId,
        userId: 'user_dev_101',
        username: 'algo_pro',
        language: 'python',
        code: mockSubmissionsCol.get(sampleSubmissionId).code,
        verdict: 'ACCEPTED',
        executionTimeMs: 35,
        memoryUsedKb: 14200,
        passedCount: 5,
        totalCount: 5
      };

      const result = await aiService.evaluateSubmissionAi(ctx, { db: mockDb });

      expect(result.success).toBe(true);
      expect(result.aiStatus).toBe('COMPLETED');

      // Verify report was updated with Multi-Approach Taxonomy and Code Quality
      const updatedReport = mockReportsCol.get('report_initial_1');
      expect(updatedReport.aiAnalysis.status).toBe('COMPLETED');
      expect(updatedReport.aiAnalysis.codeQuality.qualityGrade).toBe('A+');
      expect(updatedReport.aiAnalysis.codeQuality.overallScore).toBe(95);

      // Verify "Kitne type se solve ho sakti thi"
      expect(updatedReport.aiAnalysis.solutionApproaches).toHaveLength(3);
      expect(updatedReport.aiAnalysis.solutionApproaches[0].title).toContain('Brute Force');
      expect(updatedReport.aiAnalysis.solutionApproaches[2].isUserApproach).toBe(true);
      expect(updatedReport.aiAnalysis.comparisonMatrix).toHaveLength(3);

      // Verify "Kya improve karni hai"
      expect(updatedReport.aiAnalysis.improvements).toHaveLength(1);
      expect(updatedReport.aiAnalysis.improvements[0].category).toBe('CLEAN_CODE');
    });

    it('should bypass AI analysis when deterministic verdict is not ACCEPTED', async () => {
      const waSubmissionId = '654321654321654321654322';
      mockSubmissionsCol.insertOne({
        _id: waSubmissionId,
        problemId: sampleProblemId,
        userId: 'user_dev_101',
        username: 'algo_pro',
        language: 'python',
        code: 'def twoSum(nums, target): return []',
        pipelineStatus: 'COMPLETED',
        verdict: 'WRONG_ANSWER',
        executionTimeMs: 20,
        memoryUsedKb: 12000,
        compositeScore: 0,
        testCasesTotal: 5,
        testCasesPassed: 1,
        testResults: []
      });

      const req: any = { params: { submissionId: waSubmissionId } };
      let responseStatusCode = 0;
      let responseBody: any = null;

      const res: any = {
        status: (code: number) => {
          responseStatusCode = code;
          return {
            json: (body: any) => {
              responseBody = body;
            }
          };
        }
      };

      vi.spyOn(SubmissionModel, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockSubmissionsCol.get(waSubmissionId))
      } as any);

      await getSubmissionAiAnalysis(req, res);

      expect(responseStatusCode).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.status).toBe('SKIPPED');
      expect(responseBody.data.message).toContain('bypassed');
    });
  });

  describe('2. Controller & REST Endpoint: GET /api/submissions/:submissionId/ai-analysis', () => {
    it('should return 404 when submission does not exist', async () => {
      vi.spyOn(SubmissionModel, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue(null)
      } as any);

      const req: any = { params: { submissionId: 'non_existent_id' } };
      let responseStatusCode = 0;
      let responseBody: any = null;

      const res: any = {
        status: (code: number) => {
          responseStatusCode = code;
          return {
            json: (body: any) => {
              responseBody = body;
            }
          };
        }
      };

      await getSubmissionAiAnalysis(req, res);

      expect(responseStatusCode).toBe(404);
      expect(responseBody.error.code).toBe('NOT_FOUND');
    });

    it('should return status PENDING when code execution is still running', async () => {
      const pendingSub = {
        _id: sampleSubmissionId,
        verdict: 'PENDING'
      };

      vi.spyOn(SubmissionModel, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue(pendingSub)
      } as any);

      const req: any = { params: { submissionId: sampleSubmissionId } };
      let responseStatusCode = 0;
      let responseBody: any = null;

      const res: any = {
        status: (code: number) => {
          responseStatusCode = code;
          return {
            json: (body: any) => {
              responseBody = body;
            }
          };
        }
      };

      await getSubmissionAiAnalysis(req, res);

      expect(responseStatusCode).toBe(200);
      expect(responseBody.data.status).toBe('PENDING');
      expect(responseBody.data.message).toContain('still in progress');
    });

    it('should return complete code quality, improvements, and multi-approach solutions on COMPLETED', async () => {
      const acceptedSub = {
        _id: sampleSubmissionId,
        verdict: 'ACCEPTED',
        aiStatus: 'COMPLETED'
      };

      const completedReport = {
        submissionId: sampleSubmissionId,
        problemId: sampleProblemId,
        verdict: 'ACCEPTED',
        aiAnalysis: {
          status: 'COMPLETED',
          codeSummary: 'Single-pass hash table with O(N) complexity.',
          codeQuality: {
            score: 9,
            qualityGrade: 'A+',
            overallScore: 94,
            readabilityAnalysis: 'Exceptional readability.',
            codeSmells: [],
            positivePractices: ['Linear scan with dictionary lookup']
          },
          theoreticalComplexity: {
            timeComplexity: 'O(N)',
            spaceComplexity: 'O(N)',
            explanation: 'Single traversal'
          },
          improvements: [
            {
              category: 'PERFORMANCE',
              suggestion: 'Pre-allocate hash map bucket size if language supports it.'
            }
          ],
          solutionApproaches: [
            {
              approachNumber: 1,
              title: 'Brute Force',
              paradigm: 'BRUTE_FORCE',
              isUserApproach: false,
              timeComplexity: 'O(N^2)',
              spaceComplexity: 'O(1)',
              intuition: 'Nested loops'
            },
            {
              approachNumber: 2,
              title: 'Hash Map',
              paradigm: 'HASHING',
              isUserApproach: true,
              timeComplexity: 'O(N)',
              spaceComplexity: 'O(N)',
              intuition: 'Store complements in dictionary'
            }
          ],
          comparisonMatrix: [
            { approach: 'Brute Force', time: 'O(N^2)', space: 'O(1)', suitability: 'Educational only' },
            { approach: 'Hash Map', time: 'O(N)', space: 'O(N)', suitability: 'Production standard' }
          ],
          generatedAt: new Date().toISOString()
        }
      };

      vi.spyOn(SubmissionModel, 'findById').mockReturnValue({
        lean: vi.fn().mockResolvedValue(acceptedSub)
      } as any);

      vi.spyOn(EvaluationReportModel, 'findOne').mockReturnValue({
        lean: vi.fn().mockResolvedValue(completedReport)
      } as any);

      const req: any = { params: { submissionId: sampleSubmissionId } };
      let responseStatusCode = 0;
      let responseBody: any = null;

      const res: any = {
        status: (code: number) => {
          responseStatusCode = code;
          return {
            json: (body: any) => {
              responseBody = body;
            }
          };
        }
      };

      await getSubmissionAiAnalysis(req, res);

      expect(responseStatusCode).toBe(200);
      expect(responseBody.data.status).toBe('COMPLETED');
      expect(responseBody.data.codeQuality.qualityGrade).toBe('A+');
      expect(responseBody.data.codeQuality.overallScore).toBe(94);
      expect(responseBody.data.solutionApproaches).toHaveLength(2);
      expect(responseBody.data.solutionApproaches[1].isUserApproach).toBe(true);
      expect(responseBody.data.improvements).toHaveLength(1);
      expect(responseBody.data.comparisonMatrix).toHaveLength(2);
    });
  });
});
