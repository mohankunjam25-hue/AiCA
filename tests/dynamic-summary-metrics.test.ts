import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { getCatalogSummary } from '../apps/api/src/controllers/problem.controller.js';
import { getActivityHeatmap } from '../apps/api/src/controllers/submission.controller.js';
import { getDeveloperProfile, getDeveloperDirectory } from '../apps/api/src/controllers/developer.controller.js';
import { ProblemModel } from '../apps/api/src/models/mongodb/problem.model.js';
import { SubmissionModel } from '../apps/api/src/models/mongodb/submission.model.js';
import { EvaluationReportModel } from '../apps/api/src/models/mongodb/evaluation-report.model.js';
import { CacheService } from '../apps/api/src/services/cache.service.js';
import { pgPool } from '../apps/api/src/config/db.js';

function mockReqRes(options: {
  query?: Record<string, any>;
  params?: Record<string, any>;
  user?: { id: string; role?: string; username?: string };
} = {}) {
  const req: any = {
    query: options.query || {},
    params: options.params || {},
    body: {},
    user: options.user || undefined,
    headers: {}
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
    setHeader(name: string, value: string) {
      this.headers[name] = value;
      return this;
    }
  };
  return { req, res };
}

describe('Dynamic Platform Summary & Zero-Hardcode Telemetry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(ProblemModel.base.connection, 'readyState', 'get').mockReturnValue(1);
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);
    vi.spyOn(CacheService, 'get').mockResolvedValue(null);
    vi.spyOn(CacheService, 'set').mockResolvedValue(undefined);
  });

  it('getCatalogSummary aggregates real totalProblems, byDifficulty, topicCounts, dailyChallenge, and spotlights', async () => {
    const p1Id = new mongoose.Types.ObjectId();
    const p2Id = new mongoose.Types.ObjectId();
    const p3Id = new mongoose.Types.ObjectId();

    const mockProblems = [
      {
        _id: p1Id,
        title: 'Binary Search Bounds',
        slug: 'binary-search-bounds',
        difficulty: 'EASY',
        tags: ['Binary-Search', 'Arrays'],
        description: 'Locate boundary indices.',
        totalSubmissions: 12,
        acceptedSubmissions: 9
      },
      {
        _id: p2Id,
        title: 'Sliding Window Max',
        slug: 'sliding-window-max',
        difficulty: 'MEDIUM',
        tags: ['Sliding-Window', 'Arrays'],
        description: 'Monotonic deque window maximum.',
        totalSubmissions: 20,
        acceptedSubmissions: 10
      },
      {
        _id: p3Id,
        title: 'Minimum Cut Flow',
        slug: 'minimum-cut-flow',
        difficulty: 'HARD',
        tags: ['Graph'],
        description: 'Max flow min cut theorem.',
        totalSubmissions: 5,
        acceptedSubmissions: 2
      }
    ];

    vi.spyOn(ProblemModel, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(mockProblems)
        })
      })
    } as any);

    const { req, res } = mockReqRes();
    await getCatalogSummary(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data.success).toBe(true);
    const data = res.data.data;
    expect(data.totalProblems).toBe(3);
    expect(data.byDifficulty).toEqual({ easy: 1, medium: 1, hard: 1 });
    expect(data.topicCounts).toEqual({
      Arrays: 2,
      'Binary-Search': 1,
      'Sliding-Window': 1,
      Graph: 1
    });
    expect(data.dailyChallenge).toBeTruthy();
    expect(['binary-search-bounds', 'sliding-window-max', 'minimum-cut-flow']).toContain(
      data.dailyChallenge.slug
    );
    expect(data.spotlights.length).toBe(3);
  });

  it('getActivityHeatmap returns zeros and empty breakdowns when a user has no submissions', async () => {
    vi.spyOn(SubmissionModel, 'find').mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      })
    } as any);

    const { req, res } = mockReqRes({ user: { id: 'new_user_1' } });
    await getActivityHeatmap(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data.data.problemsSolved).toBe(0);
    expect(res.data.data.totalSubmissions).toBe(0);
    expect(res.data.data.currentStreak).toBe(0);
    expect(res.data.data.solvedToday).toBe(false);
    expect(res.data.data.difficultyBreakdown).toEqual({ easy: 0, medium: 0, hard: 0 });
    expect(res.data.data.languageBreakdown).toEqual([]);
    expect(res.data.data.masteredTopics).toEqual([]);
    expect(res.data.data.avgEvolutionDelta).toBeNull();
  });

  it('getActivityHeatmap computes real difficulty, language, topic mastery, and evolution delta', async () => {
    const p1 = new mongoose.Types.ObjectId();
    const today = new Date();

    vi.spyOn(SubmissionModel, 'find').mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            problemId: p1.toString(),
            verdict: 'WRONG_ANSWER',
            language: 'python',
            executionTimeMs: 100,
            createdAt: today
          },
          {
            problemId: p1.toString(),
            verdict: 'ACCEPTED',
            language: 'python',
            executionTimeMs: 25,
            createdAt: today
          }
        ])
      })
    } as any);

    vi.spyOn(ProblemModel, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: p1, difficulty: 'MEDIUM', tags: ['Dynamic-Programming', 'Arrays'] }
        ])
      })
    } as any);

    const { req, res } = mockReqRes({ user: { id: 'usr_real_1' } });
    await getActivityHeatmap(req, res);

    expect(res.statusCode).toBe(200);
    const d = res.data.data;
    expect(d.problemsSolved).toBe(1);
    expect(d.totalSubmissions).toBe(2);
    expect(d.solvedToday).toBe(true);
    expect(d.difficultyBreakdown).toEqual({ easy: 0, medium: 1, hard: 0 });
    expect(d.languageBreakdown).toEqual([{ language: 'python', count: 2, percentage: 100 }]);
    expect(d.masteredTopics).toEqual([
      { tag: 'Dynamic-Programming', count: 1 },
      { tag: 'Arrays', count: 1 }
    ]);
    expect(d.avgEvolutionDelta).toBe(75);
  });

  it('getActivityHeatmap separates ObjectIds and slugs so non-ObjectId problemIds never trigger Mongoose CastError', async () => {
    const p1 = new mongoose.Types.ObjectId();
    const today = new Date();

    vi.spyOn(SubmissionModel, 'find').mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { problemId: p1.toString(), verdict: 'ACCEPTED', language: 'python', executionTimeMs: 10, createdAt: today },
          { problemId: 'two-sum-optimal', verdict: 'ACCEPTED', language: 'javascript', executionTimeMs: 15, createdAt: today }
        ])
      })
    } as any);

    const findSpy = vi.spyOn(ProblemModel, 'find').mockImplementation((query: any) => {
      // Regression assertion: raw non-ObjectId strings must NEVER be passed to _id: { $in: ... }
      const rawJson = JSON.stringify(query);
      expect(rawJson).toContain('two-sum-optimal');
      expect(rawJson).toContain('"slug"');
      expect(JSON.stringify(query.$or?.[0] || query)).not.toContain('two-sum-optimal');
      return {
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            { _id: p1, difficulty: 'EASY', tags: ['Arrays'] },
            { _id: new mongoose.Types.ObjectId(), slug: 'two-sum-optimal', difficulty: 'MEDIUM', tags: ['Hash-Table'] }
          ])
        })
      } as any;
    });

    const { req, res } = mockReqRes({ user: { id: 'usr_mixed_ids' } });
    await getActivityHeatmap(req, res);

    expect(findSpy).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
    expect(res.data.data.problemsSolved).toBe(2);
    expect(res.data.data.difficultyBreakdown).toEqual({ easy: 1, medium: 1, hard: 0 });
  });

  it('getDeveloperDirectory populates real topSkills instead of hardcoded placeholders', async () => {
    const probId = new mongoose.Types.ObjectId();

    vi.spyOn(SubmissionModel, 'aggregate').mockResolvedValue([
      {
        _id: 'u1',
        username: 'solver_one',
        problemsSolved: 1,
        totalScore: 95,
        problemIds: [probId.toString()]
      }
    ]);

    vi.spyOn(ProblemModel, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ _id: probId, tags: ['Graph', 'BFS'] }])
      })
    } as any);

    vi.spyOn(pgPool, 'query')
      .mockResolvedValueOnce({
        rows: [
          { id: 'u1', username: 'solver_one', full_name: 'Solver One', current_streak: 3 },
          { id: 'u2', username: 'new_dev', full_name: 'New Dev', current_streak: 0 }
        ]
      } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    const { req, res } = mockReqRes({ user: { id: 'viewer_1' } });
    await getDeveloperDirectory(req, res);

    expect(res.statusCode).toBe(200);
    const devs = res.data.data.developers;
    const solver = devs.find((x: any) => x.userId === 'u1');
    const newbie = devs.find((x: any) => x.userId === 'u2');
    expect(solver.topSkills).toEqual(['Graph', 'BFS']);
    expect(newbie.topSkills).toEqual([]);
  });

  it('getDeveloperProfile reads actual EvaluationReport summary when unlocked rather than hardcoded text', async () => {
    const reportId = new mongoose.Types.ObjectId();

    vi.spyOn(pgPool, 'query')
      .mockResolvedValueOnce({
        rows: [{ id: 'target_id', username: 'coder1', full_name: 'Coder One' }]
      } as any)
      .mockResolvedValueOnce({ rows: [{ 1: 1 }] } as any)
      .mockResolvedValueOnce({ rows: [{ followers: 1, following: 0 }] } as any);

    vi.spyOn(SubmissionModel, 'aggregate').mockResolvedValue([
      {
        problemId: 'prob_a',
        language: 'python',
        compositeScore: 90,
        code: 'print(1)',
        executionTimeMs: 12,
        memoryUsedKb: 10240,
        evaluationReportId: reportId.toString()
      }
    ]);

    vi.spyOn(ProblemModel, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: { toString: () => 'prob_a' }, title: 'Test Prob', slug: 'test-prob', difficulty: 'EASY', tags: [] }
        ])
      })
    } as any);

    vi.spyOn(EvaluationReportModel, 'find').mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: reportId, aiAnalysis: { codeSummary: 'O(N) hash solution verified.' }, summary: 'Fallback summary' }
        ])
      })
    } as any);

    const { req, res } = mockReqRes({
      user: { id: 'viewer_99' },
      params: { username: 'coder1' }
    });

    await getDeveloperProfile(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.data.data.solvedProblems[0].aiAnalysisSummary).toBe('O(N) hash solution verified.');
  });
});
