import { describe, it, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { getProblems } from '../apps/api/src/controllers/problem.controller.js';
import { ProblemModel } from '../apps/api/src/models/mongodb/problem.model.js';
import { SubmissionModel } from '../apps/api/src/models/mongodb/submission.model.js';
import { ProblemListItem } from '@aica/shared';

function mockReqRes(options: {
  query?: Record<string, any>;
  user?: { id: string; role: string; username?: string };
}) {
  const req: any = {
    query: options.query || {},
    params: {},
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

describe('Dynamic Problem Hub: Segregation & Status Metrics', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(ProblemModel.base.connection, 'readyState', 'get').mockReturnValue(1);
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);
  });

  it('correctly filters to SOLVED problems and enriches items with best runtime and solution code', async () => {
    const solvedProbId = new mongoose.Types.ObjectId();
    const otherProbId = new mongoose.Types.ObjectId();

    const mockProblems = [
      {
        _id: solvedProbId,
        title: 'Two Sum Optimal',
        slug: 'two-sum-optimal',
        difficulty: 'EASY',
        tags: ['Arrays'],
        totalSubmissions: 20,
        acceptedSubmissions: 15
      }
    ];

    // Mock submissions for filter aggregation
    vi.spyOn(SubmissionModel, 'find').mockImplementation((query: any) => {
      // If querying all user submissions for filter
      if (!query.problemId) {
        return {
          select: () => ({
            lean: () =>
              Promise.resolve([
                { problemId: solvedProbId.toString(), verdict: 'ACCEPTED' },
                { problemId: otherProbId.toString(), verdict: 'WRONG_ANSWER' }
              ])
          })
        } as any;
      }
      // If querying metrics for the returned problem IDs
      return {
        select: () => ({
          sort: () => ({
            lean: () =>
              Promise.resolve([
                {
                  problemId: solvedProbId.toString(),
                  verdict: 'ACCEPTED',
                  executionTimeMs: 14,
                  memoryUsedKb: 14200,
                  code: 'class Solution: def twoSum(): pass',
                  createdAt: new Date()
                }
              ])
          })
        })
      } as any;
    });

    let capturedFilter: any = null;
    vi.spyOn(ProblemModel, 'find').mockImplementation((filter: any) => {
      capturedFilter = filter;
      return {
        select: () => ({
          skip: () => ({
            limit: () => ({
              sort: () => ({
                lean: () => Promise.resolve(mockProblems)
              })
            })
          })
        })
      } as any;
    });

    vi.spyOn(ProblemModel, 'countDocuments').mockResolvedValue(1 as any);

    const { req, res } = mockReqRes({
      query: { statusFilter: 'SOLVED' },
      user: { id: 'student_999', role: 'STUDENT' }
    });

    await getProblems(req, res);

    expect(res.statusCode).toBe(200);
    expect(capturedFilter._id).toBeDefined();
    expect(capturedFilter._id.$in).toHaveLength(1);
    expect(capturedFilter._id.$in[0].toString()).toBe(solvedProbId.toString());

    const items: ProblemListItem[] = res.data.data.problems;
    expect(items).toHaveLength(1);
    expect(items[0].userStatus).toBe('SOLVED');
    expect(items[0].bestRuntimeMs).toBe(14);
    expect(items[0].bestMemoryKb).toBe(14200);
    expect(items[0].solutionCode).toBe('class Solution: def twoSum(): pass');
  });

  it('correctly filters to ATTEMPTED problems and annotates with last failed verdict', async () => {
    const attemptedProbId = new mongoose.Types.ObjectId();
    const mockProblems = [
      {
        _id: attemptedProbId,
        title: 'Trapping Rain Water',
        slug: 'trapping-rain-water',
        difficulty: 'HARD',
        tags: ['Two-Pointers'],
        totalSubmissions: 45,
        acceptedSubmissions: 12
      }
    ];

    vi.spyOn(SubmissionModel, 'find').mockImplementation((query: any) => {
      if (!query.problemId) {
        return {
          select: () => ({
            lean: () =>
              Promise.resolve([
                { problemId: attemptedProbId.toString(), verdict: 'TIME_LIMIT_EXCEEDED' }
              ])
          })
        } as any;
      }
      return {
        select: () => ({
          sort: () => ({
            lean: () =>
              Promise.resolve([
                {
                  problemId: attemptedProbId.toString(),
                  verdict: 'TIME_LIMIT_EXCEEDED',
                  executionTimeMs: 2000,
                  memoryUsedKb: 25000,
                  createdAt: new Date()
                }
              ])
          })
        })
      } as any;
    });

    let capturedFilter: any = null;
    vi.spyOn(ProblemModel, 'find').mockImplementation((filter: any) => {
      capturedFilter = filter;
      return {
        select: () => ({
          skip: () => ({
            limit: () => ({
              sort: () => ({
                lean: () => Promise.resolve(mockProblems)
              })
            })
          })
        })
      } as any;
    });

    vi.spyOn(ProblemModel, 'countDocuments').mockResolvedValue(1 as any);

    const { req, res } = mockReqRes({
      query: { statusFilter: 'ATTEMPTED' },
      user: { id: 'student_999', role: 'STUDENT' }
    });

    await getProblems(req, res);

    expect(res.statusCode).toBe(200);
    expect(capturedFilter._id.$in).toHaveLength(1);
    expect(capturedFilter._id.$in[0].toString()).toBe(attemptedProbId.toString());

    const items: ProblemListItem[] = res.data.data.problems;
    expect(items[0].userStatus).toBe('ATTEMPTED');
    expect(items[0].lastVerdict).toBe('TIME_LIMIT_EXCEEDED');
  });

  it('correctly filters to TODO (unattempted) problems using $nin', async () => {
    const touchedProbId = new mongoose.Types.ObjectId();
    const todoProbId = new mongoose.Types.ObjectId();

    vi.spyOn(SubmissionModel, 'find').mockImplementation((query: any) => {
      return {
        select: () => ({
          lean: () =>
            Promise.resolve([
              { problemId: touchedProbId.toString(), verdict: 'ACCEPTED' }
            ])
        })
      } as any;
    });

    let capturedFilter: any = null;
    vi.spyOn(ProblemModel, 'find').mockImplementation((filter: any) => {
      capturedFilter = filter;
      return {
        select: () => ({
          skip: () => ({
            limit: () => ({
              sort: () => ({
                lean: () =>
                  Promise.resolve([
                    {
                      _id: todoProbId,
                      title: 'Fresh Problem',
                      slug: 'fresh-prob',
                      difficulty: 'MEDIUM',
                      tags: ['Trees'],
                      totalSubmissions: 0,
                      acceptedSubmissions: 0
                    }
                  ])
              })
            })
          })
        })
      } as any;
    });

    vi.spyOn(ProblemModel, 'countDocuments').mockResolvedValue(1 as any);

    const { req, res } = mockReqRes({
      query: { statusFilter: 'TODO' },
      user: { id: 'student_999', role: 'STUDENT' }
    });

    await getProblems(req, res);

    expect(res.statusCode).toBe(200);
    expect(capturedFilter._id.$nin).toBeDefined();
    expect(capturedFilter._id.$nin[0].toString()).toBe(touchedProbId.toString());

    const items: ProblemListItem[] = res.data.data.problems;
    expect(items[0].userStatus).toBe('TODO');
  });

  it('correctly filters to UNSOLVED problems by excluding solved IDs using $nin', async () => {
    const solvedProbId = new mongoose.Types.ObjectId();
    const unsolvedProbId = new mongoose.Types.ObjectId();

    vi.spyOn(SubmissionModel, 'find').mockImplementation((query: any) => {
      return {
        select: () => ({
          lean: () =>
            Promise.resolve([
              { problemId: solvedProbId.toString(), verdict: 'ACCEPTED' }
            ])
        })
      } as any;
    });

    let capturedFilter: any = null;
    vi.spyOn(ProblemModel, 'find').mockImplementation((filter: any) => {
      capturedFilter = filter;
      return {
        select: () => ({
          skip: () => ({
            limit: () => ({
              sort: () => ({
                lean: () =>
                  Promise.resolve([
                    {
                      _id: unsolvedProbId,
                      title: 'Unsolved Problem',
                      slug: 'unsolved-prob',
                      difficulty: 'MEDIUM',
                      tags: ['Strings'],
                      totalSubmissions: 5,
                      acceptedSubmissions: 0
                    }
                  ])
              })
            })
          })
        })
      } as any;
    });

    vi.spyOn(ProblemModel, 'countDocuments').mockResolvedValue(1 as any);

    const { req, res } = mockReqRes({
      query: { statusFilter: 'UNSOLVED' },
      user: { id: 'student_999', role: 'STUDENT' }
    });

    await getProblems(req, res);

    expect(res.statusCode).toBe(200);
    expect(capturedFilter._id.$nin).toBeDefined();
    expect(capturedFilter._id.$nin[0].toString()).toBe(solvedProbId.toString());

    const items: ProblemListItem[] = res.data.data.problems;
    expect(items).toHaveLength(1);
    expect(items[0].slug).toBe('unsolved-prob');
  });

  it('safely returns 0 items for unauthenticated guests filtering by SOLVED or ATTEMPTED', async () => {
    let capturedFilter: any = null;
    vi.spyOn(ProblemModel, 'find').mockImplementation((filter: any) => {
      capturedFilter = filter;
      return {
        select: () => ({
          skip: () => ({
            limit: () => ({
              sort: () => ({
                lean: () => Promise.resolve([])
              })
            })
          })
        })
      } as any;
    });
    vi.spyOn(ProblemModel, 'countDocuments').mockResolvedValue(0 as any);

    const { req, res } = mockReqRes({
      query: { statusFilter: 'SOLVED' }
      // No user
    });

    await getProblems(req, res);

    expect(res.statusCode).toBe(200);
    expect(capturedFilter._id.$in).toEqual([]);
    expect(res.data.data.problems).toEqual([]);
  });
});
