import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import {
  ComparisonCreateSchema,
  GlobalLeaderboardResponse,
  ProblemListItem
} from '../packages/shared/dist/index.js';
import {
  createComparison,
  getProblemComparison,
  getComparisonById
} from '../apps/api/src/controllers/comparison.controller.js';
import {
  getGlobalLeaderboard,
  getUserSolvedProblems
} from '../apps/api/src/controllers/leaderboard.controller.js';
import { getProblems } from '../apps/api/src/controllers/problem.controller.js';
import { createSubmission, submissionQueue } from '../apps/api/src/controllers/submission.controller.js';
import { SubmissionModel } from '../apps/api/src/models/mongodb/submission.model.js';
import { SolutionComparisonModel } from '../apps/api/src/models/mongodb/comparison.model.js';
import { ProblemModel } from '../apps/api/src/models/mongodb/problem.model.js';
import { EvaluationReportModel } from '../apps/api/src/models/mongodb/evaluation-report.model.js';
import { GeminiAnalysisClient } from '../packages/ai-engine/dist/index.js';
import { pgPool } from '../apps/api/src/config/db.js';

function mockReqRes(options: {
  query?: Record<string, any>;
  params?: Record<string, any>;
  body?: any;
  user?: any;
  headers?: Record<string, string>;
}) {
  const req: any = {
    query: options.query || {},
    params: options.params || {},
    body: options.body || {},
    user: options.user,
    headers: options.headers || {}
  };

  const res: any = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.data = payload;
      return this;
    },
    setHeader(name: string, val: string) {
      this.headers[name] = val;
      return this;
    }
  };

  return { req, res };
}

describe('Phase 4: Evolutionary Solution Comparison, Global Leaderboards & Platform Hardening', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(ProblemModel.base.connection, 'readyState', 'get').mockReturnValue(1);
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Solution Comparison Engine
  // =========================================================================
  describe('1. Solution Comparison API', () => {
    it('ComparisonCreateSchema: validates required submission IDs', () => {
      expect(ComparisonCreateSchema.safeParse({}).success).toBe(false);
      expect(ComparisonCreateSchema.safeParse({ submissionIdA: 'sub_1' }).success).toBe(false);
      expect(ComparisonCreateSchema.safeParse({ submissionIdA: 'sub_1', submissionIdB: 'sub_2' }).success).toBe(true);
    });

    it('createComparison: rejects when submissions do not exist (404)', async () => {
      vi.spyOn(SubmissionModel, 'findById').mockReturnValue({ lean: () => Promise.resolve(null) } as any);

      const { req, res } = mockReqRes({
        user: { id: 'user_1', role: 'STUDENT' },
        body: { submissionIdA: 'missing_1', submissionIdB: 'missing_2' }
      });

      await createComparison(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.data.error.code).toBe('NOT_FOUND');
    });

    it('createComparison: rejects comparing submissions for different problems (400)', async () => {
      vi.spyOn(SubmissionModel, 'findById')
        .mockReturnValueOnce({ lean: () => Promise.resolve({ _id: 'sub_1', problemId: 'prob_A', userId: 'user_1' }) } as any)
        .mockReturnValueOnce({ lean: () => Promise.resolve({ _id: 'sub_2', problemId: 'prob_B', userId: 'user_1' }) } as any);

      const { req, res } = mockReqRes({
        user: { id: 'user_1', role: 'STUDENT' },
        body: { submissionIdA: 'sub_1', submissionIdB: 'sub_2' }
      });

      await createComparison(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.data.error.code).toBe('PROBLEM_MISMATCH');
    });

    it('createComparison: blocks unauthorized student from comparing other students submissions (403)', async () => {
      vi.spyOn(SubmissionModel, 'findById')
        .mockReturnValueOnce({ lean: () => Promise.resolve({ _id: 'sub_1', problemId: 'prob_1', userId: 'other_user_A' }) } as any)
        .mockReturnValueOnce({ lean: () => Promise.resolve({ _id: 'sub_2', problemId: 'prob_1', userId: 'other_user_B' }) } as any);

      const { req, res } = mockReqRes({
        user: { id: 'student_attacker', role: 'STUDENT' },
        body: { submissionIdA: 'sub_1', submissionIdB: 'sub_2' }
      });

      await createComparison(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.data.error.code).toBe('FORBIDDEN');
    });

    it('createComparison: creates comparison and gracefully falls back if Gemini AI fails', async () => {
      const subA = {
        _id: 'sub_1',
        problemId: 'prob_1',
        userId: 'user_1',
        username: 'Student A',
        language: 'python',
        code: 'def twoSum(): pass',
        executionTimeMs: 120,
        memoryUsedKb: 15000,
        compositeScore: 78.5,
        createdAt: new Date()
      };
      const subB = {
        _id: 'sub_2',
        problemId: 'prob_1',
        userId: 'user_1',
        username: 'Student A',
        language: 'python',
        code: 'def twoSumOptimized(): pass',
        executionTimeMs: 25,
        memoryUsedKb: 14000,
        compositeScore: 94.2,
        createdAt: new Date()
      };

      vi.spyOn(SubmissionModel, 'findById')
        .mockReturnValueOnce({ lean: () => Promise.resolve(subA) } as any)
        .mockReturnValueOnce({ lean: () => Promise.resolve(subB) } as any);

      vi.spyOn(ProblemModel, 'findById').mockReturnValue({ lean: () => Promise.resolve({ _id: 'prob_1', title: 'Two Sum' }) } as any);
      vi.spyOn(EvaluationReportModel, 'findOne').mockReturnValue({ lean: () => Promise.resolve(null) } as any);
      vi.spyOn(GeminiAnalysisClient.prototype, 'analyzeComparison').mockRejectedValueOnce(
        new Error('AI_CONFIG_ERROR: Google Gemini API key is missing. Set GEMINI_API_KEY in environment variables.')
      );

      let createdDoc: any = null;
      vi.spyOn(SolutionComparisonModel, 'create').mockImplementation((doc: any) => {
        createdDoc = doc;
        return Promise.resolve({ ...doc, _id: 'comp_123' }) as any;
      });

      const { req, res } = mockReqRes({
        user: { id: 'user_1', role: 'STUDENT' },
        body: { submissionIdA: 'sub_1', submissionIdB: 'sub_2' }
      });

      await createComparison(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.data.success).toBe(true);
      expect(createdDoc.deltaAnalysis.executionTimeDiffMs).toBe(-95);
      expect(createdDoc.deltaAnalysis.tradeOffSummary).toBeDefined();
    });

    it('getProblemComparison: retrieves the latest comparison for the authenticated user', async () => {
      const mockComp = {
        _id: 'comp_1',
        problemId: 'prob_1',
        submissionA: { userId: 'user_1' },
        submissionB: { userId: 'user_1' }
      };

      vi.spyOn(SolutionComparisonModel, 'findOne').mockReturnValue({
        sort: () => ({
          lean: () => Promise.resolve(mockComp)
        })
      } as any);

      const { req, res } = mockReqRes({
        params: { problemId: 'prob_1' },
        user: { id: 'user_1', role: 'STUDENT' }
      });

      await getProblemComparison(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.data._id).toBe('comp_1');
    });
  });

  // =========================================================================
  // 2. Global Platform Leaderboard
  // =========================================================================
  describe('2. Global Platform Leaderboard API', () => {
    it('getGlobalLeaderboard: aggregates cross-problem standings and calculates total score & problems solved', async () => {
      const rawAggregation = [
        {
          rankings: [
            {
              _id: 'user_1',
              username: 'top_coder',
              problemsSolved: 5,
              totalScore: 475.5,
              avgRuntimeMs: 18.2,
              lastActiveAt: new Date('2026-11-06T00:00:00Z')
            },
            {
              _id: 'user_2',
              username: 'algo_pro',
              problemsSolved: 3,
              totalScore: 280.0,
              avgRuntimeMs: 25.4,
              lastActiveAt: new Date('2026-11-05T00:00:00Z')
            }
          ],
          totalCount: [{ count: 2 }]
        }
      ];

      vi.spyOn(SubmissionModel, 'aggregate').mockResolvedValue(rawAggregation as any);
      vi.spyOn(pgPool, 'query').mockResolvedValue({
        rows: [
          { user_id: 'user_1', avatar_url: 'https://avatar.com/1.png', current_streak: 7 },
          { user_id: 'user_2', avatar_url: null, current_streak: 3 }
        ]
      } as any);

      const { req, res } = mockReqRes({ query: { page: '1', limit: '20' } });

      await getGlobalLeaderboard(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      const data: GlobalLeaderboardResponse = res.data.data;
      expect(data.totalRanked).toBe(2);
      expect(data.rankings).toHaveLength(2);

      // Rank 1
      expect(data.rankings[0].rank).toBe(1);
      expect(data.rankings[0].username).toBe('top_coder');
      expect(data.rankings[0].problemsSolved).toBe(5);
      expect(data.rankings[0].totalScore).toBe(475.5);
      expect(data.rankings[0].streak).toBe(7);
      expect(data.rankings[0].avatarUrl).toBe('https://avatar.com/1.png');

      // Rank 2
      expect(data.rankings[1].rank).toBe(2);
      expect(data.rankings[1].username).toBe('algo_pro');
      expect(data.rankings[1].problemsSolved).toBe(3);
      expect(data.rankings[1].streak).toBe(3);
    });
  });

  // =========================================================================
  // 3. Problem Catalog Solved Status Badges
  // =========================================================================
  describe('3. Problem Catalog Solved Status Annotations', () => {
    it('annotates problems with SOLVED, ATTEMPTED, and TODO for authenticated students', async () => {
      const prob1Id = new mongoose.Types.ObjectId();
      const prob2Id = new mongoose.Types.ObjectId();
      const prob3Id = new mongoose.Types.ObjectId();

      const mockProblems = [
        { _id: prob1Id, title: 'Problem 1', slug: 'prob-1', difficulty: 'EASY', tags: ['Arrays'], totalSubmissions: 10, acceptedSubmissions: 5 },
        { _id: prob2Id, title: 'Problem 2', slug: 'prob-2', difficulty: 'MEDIUM', tags: ['Strings'], totalSubmissions: 8, acceptedSubmissions: 2 },
        { _id: prob3Id, title: 'Problem 3', slug: 'prob-3', difficulty: 'HARD', tags: ['DP'], totalSubmissions: 4, acceptedSubmissions: 0 }
      ];

      vi.spyOn(ProblemModel, 'find').mockReturnValue({
        select: () => ({
          skip: () => ({
            limit: () => ({
              sort: () => ({
                lean: () => Promise.resolve(mockProblems)
              })
            })
          })
        })
      } as any);

      vi.spyOn(ProblemModel, 'countDocuments').mockResolvedValue(3 as any);

      // Mock user submissions: prob1 has ACCEPTED, prob2 has only WRONG_ANSWER, prob3 has none
      vi.spyOn(SubmissionModel, 'find').mockReturnValue({
        select: () => ({
          lean: () => Promise.resolve([
            { problemId: prob1Id.toString(), verdict: 'ACCEPTED' },
            { problemId: prob2Id.toString(), verdict: 'WRONG_ANSWER' }
          ])
        })
      } as any);

      const { req, res } = mockReqRes({
        user: { id: 'student_123', role: 'STUDENT' }
      });

      await getProblems(req, res);

      expect(res.statusCode).toBe(200);
      const items: ProblemListItem[] = res.data.data.problems;
      expect(items).toHaveLength(3);

      expect(items[0].userStatus).toBe('SOLVED');
      expect(items[1].userStatus).toBe('ATTEMPTED');
      expect(items[2].userStatus).toBe('TODO');
    });

    it('leaves userStatus undefined for unauthenticated guest visitors', async () => {
      const mockProblems = [
        { _id: new mongoose.Types.ObjectId(), title: 'Problem 1', slug: 'prob-1', difficulty: 'EASY', tags: [], totalSubmissions: 0, acceptedSubmissions: 0 }
      ];

      vi.spyOn(ProblemModel, 'find').mockReturnValue({
        select: () => ({
          skip: () => ({
            limit: () => ({
              sort: () => ({
                lean: () => Promise.resolve(mockProblems)
              })
            })
          })
        })
      } as any);

      vi.spyOn(ProblemModel, 'countDocuments').mockResolvedValue(1 as any);

      const { req, res } = mockReqRes({}); // no user

      await getProblems(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.data.problems[0].userStatus).toBeUndefined();
    });
  });

  // =========================================================================
  // 4. Submission Hardening (Unpublished Problems)
  // =========================================================================
  describe('4. Submission Hardening (Unpublished & Archived Problems)', () => {
    it('blocks student submissions to UNPUBLISHED problems (404 NOT_FOUND)', async () => {
      vi.spyOn(ProblemModel, 'findById').mockResolvedValue({
        _id: 'unpublished_prob_id',
        status: 'UNPUBLISHED',
        testCases: []
      } as any);

      const { req, res } = mockReqRes({
        user: { id: 'student_1', role: 'STUDENT' },
        body: {
          problemId: 'unpublished_prob_id',
          language: 'python',
          code: 'print(1)',
          isTestRun: false
        }
      });

      await createSubmission(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.data.error.code).toBe('NOT_FOUND');
    });

    it('allows staff (ADMIN / INSTRUCTOR) to submit code to UNPUBLISHED problems for verification', async () => {
      vi.spyOn(ProblemModel, 'findById').mockResolvedValue({
        _id: 'unpublished_prob_id',
        status: 'UNPUBLISHED',
        testCases: [{ id: 'tc-1', input: '1', expectedOutput: '1', isPublic: true }]
      } as any);

      vi.spyOn(SubmissionModel, 'create').mockResolvedValue({
        _id: new mongoose.Types.ObjectId()
      } as any);

      vi.spyOn(submissionQueue, 'add').mockResolvedValue({ id: 'job_123' } as any);

      const { req, res } = mockReqRes({
        user: { id: 'admin_1', role: 'ADMIN' },
        body: {
          problemId: 'unpublished_prob_id',
          language: 'python',
          code: 'print(1)',
          isTestRun: false
        }
      });

      await createSubmission(req, res);

      expect(res.statusCode).toBe(202);
      expect(res.data.success).toBe(true);
    });
  });

  describe('getUserSolvedProblems API & Developer Solved Dossier', () => {
    it('returns empty list and valid metadata when user has 0 solved problems', async () => {
      vi.spyOn(SubmissionModel, 'aggregate').mockResolvedValue([]);
      vi.spyOn(pgPool, 'query').mockResolvedValue({
        rows: [{ username: 'new_student', avatar_url: 'https://avatar.png', current_streak: 2 }]
      } as any);

      const { req, res } = mockReqRes({
        params: { userId: 'usr_new_001' }
      });

      await getUserSolvedProblems(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.developer.username).toBe('new_student');
      expect(res.data.data.developer.totalSolved).toBe(0);
      expect(res.data.data.developer.difficultyBreakdown).toEqual({ easy: 0, medium: 0, hard: 0 });
      expect(res.data.data.solvedProblems).toEqual([]);
    });

    it('returns developer solved problem list with difficulty breakdown and performance metrics', async () => {
      const mockSubmissions = [
        {
          userId: 'usr_top_1',
          username: 'ace_coder',
          problemId: 'prob_1',
          language: 'python',
          compositeScore: 94.5,
          executionTimeMs: 18,
          memoryUsedKb: 14200,
          createdAt: new Date('2026-11-06T12:00:00Z')
        },
        {
          userId: 'usr_top_1',
          username: 'ace_coder',
          problemId: 'prob_2',
          language: 'cpp',
          compositeScore: 91.0,
          executionTimeMs: 12,
          memoryUsedKb: 8400,
          createdAt: new Date('2026-11-06T15:00:00Z')
        }
      ];

      vi.spyOn(SubmissionModel, 'aggregate').mockResolvedValue(mockSubmissions);

      const mockProblems = [
        {
          _id: { toString: () => 'prob_1' },
          title: 'Maximum Subarray Sum',
          slug: 'maximum-subarray-sum',
          difficulty: 'MEDIUM',
          tags: ['Arrays', 'Dynamic Programming']
        },
        {
          _id: { toString: () => 'prob_2' },
          title: 'Two Sum',
          slug: 'two-sum',
          difficulty: 'EASY',
          tags: ['Arrays', 'Hash Table']
        }
      ];

      vi.spyOn(ProblemModel, 'find').mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockProblems)
        })
      } as any);

      vi.spyOn(pgPool, 'query').mockResolvedValue({
        rows: [{ username: 'ace_coder', avatar_url: 'https://avatar.png', current_streak: 5 }]
      } as any);

      const { req, res } = mockReqRes({
        params: { userId: 'usr_top_1' }
      });

      await getUserSolvedProblems(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.developer.username).toBe('ace_coder');
      expect(res.data.data.developer.totalSolved).toBe(2);
      expect(res.data.data.developer.difficultyBreakdown).toEqual({
        easy: 1,
        medium: 1,
        hard: 0
      });
      expect(res.data.data.developer.totalScore).toBe(185.5);
      expect(res.data.data.developer.league).toBe('Master');
      expect(res.data.data.solvedProblems.length).toBe(2);
      expect(res.data.data.solvedProblems[0].title).toBe('Maximum Subarray Sum');
      expect(res.data.data.solvedProblems[0].bestRuntimeMs).toBe(18);
      expect(res.data.data.solvedProblems[1].title).toBe('Two Sum');
      expect(res.data.data.solvedProblems[1].language).toBe('cpp');
    });
  });
});
