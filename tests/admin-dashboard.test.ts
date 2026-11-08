import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import {
  getAdminOverview,
  getAdminTelemetry,
  getAdminLiveSubmissions,
  getAdminPendingProposals,
  flushSystemCache
} from '../apps/api/src/controllers/admin-dashboard.controller.js';
import { ProblemModel } from '../apps/api/src/models/mongodb/problem.model.js';
import { ProblemProposalModel } from '../apps/api/src/models/mongodb/problem-proposal.model.js';
import { SubmissionModel } from '../apps/api/src/models/mongodb/submission.model.js';
import { redisClient, pgPool } from '../apps/api/src/config/db.js';
import { requireRole } from '../apps/api/src/middleware/auth.middleware.js';

function mockReqRes(options: {
  query?: Record<string, any>;
  params?: Record<string, any>;
  body?: any;
  user?: any;
}) {
  const req: any = {
    query: options.query || {},
    params: options.params || {},
    body: options.body || {},
    user: options.user
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
    }
  };

  return { req, res };
}

describe('Admin Mission Control & Operations Dashboard Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(ProblemModel.base.connection, 'readyState', 'get').mockReturnValue(1);
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Overview Telemetry (getAdminOverview)
  // =========================================================================
  describe('1. getAdminOverview Controller', () => {
    it('returns platform overview metrics (students, published problems, submissions, proposals)', async () => {
      vi.spyOn(pgPool, 'query').mockResolvedValue({
        rows: [{ total: '1500' }]
      } as any);

      vi.spyOn(ProblemModel, 'countDocuments')
        .mockResolvedValueOnce(50 as any) // totalPublishedProblems
        .mockResolvedValueOnce(14 as any); // totalPracticeProblems

      vi.spyOn(ProblemProposalModel, 'countDocuments').mockResolvedValue(5 as any);

      vi.spyOn(SubmissionModel, 'countDocuments')
        .mockResolvedValueOnce(200 as any) // submissions24h
        .mockResolvedValueOnce(120 as any); // accepted24h

      vi.spyOn(SubmissionModel, 'distinct').mockResolvedValue(['u1', 'u2', 'u3', 'u4'] as any);

      const { req, res } = mockReqRes({
        user: { id: 'admin-1', role: 'ADMIN' }
      });

      await getAdminOverview(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      const data = res.data.data;
      expect(data.totalStudents).toBe(1500);
      expect(data.totalPublishedProblems).toBe(50);
      expect(data.totalPracticeProblems).toBe(14);
      expect(data.pendingProposals).toBe(5);
      expect(data.submissions24h).toBe(200);
      expect(data.acceptanceRate24h).toBe(60);
      expect(data.activeUsers24h).toBe(4);
    });
  });

  // =========================================================================
  // 2. Hardware Sandbox & Queue Telemetry (getAdminTelemetry)
  // =========================================================================
  describe('2. getAdminTelemetry Controller', () => {
    it('returns kernel sandbox status, redis ping, queue depth, and memory telemetry', async () => {
      vi.spyOn(redisClient, 'ping').mockResolvedValue('PONG');

      vi.spyOn(SubmissionModel, 'find').mockImplementation(() => {
        return {
          sort: () => ({
            limit: () => ({
              select: () => ({
                lean: () => Promise.resolve([
                  { executionTimeMs: 16 },
                  { executionTimeMs: 20 }
                ])
              })
            })
          })
        } as any;
      });

      const { req, res } = mockReqRes({
        user: { id: 'admin-1', role: 'ADMIN' }
      });

      await getAdminTelemetry(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      const tel = res.data.data;
      expect(tel.kernelSandboxStatus).toBe('HEALTHY');
      expect(tel.cgroupMemoryLimitMb).toBe(512);
      expect(tel.avgKernelExecutionMs).toBe(18);
      expect(tel.activeWorkers).toBe(2);
      expect(tel.memoryUsageMb).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 3. Live Submissions Audit Stream (getAdminLiveSubmissions)
  // =========================================================================
  describe('3. getAdminLiveSubmissions Controller', () => {
    it('retrieves recent platform submissions with resolved problem titles', async () => {
      const mockSubmissions = [
        {
          _id: new mongoose.Types.ObjectId(),
          problemId: 'container-with-most-water',
          username: 'algo_ace',
          language: 'python',
          verdict: 'ACCEPTED',
          executionTimeMs: 14,
          memoryUsedKb: 24500,
          createdAt: new Date()
        }
      ];

      vi.spyOn(SubmissionModel, 'find').mockImplementation(() => {
        return {
          sort: () => ({
            limit: () => ({
              select: () => ({
                lean: () => Promise.resolve(mockSubmissions)
              })
            })
          })
        } as any;
      });

      vi.spyOn(ProblemModel, 'find').mockImplementation(() => {
        return {
          select: () => ({
            lean: () => Promise.resolve([
              {
                _id: new mongoose.Types.ObjectId(),
                slug: 'container-with-most-water',
                title: 'Container With Most Water'
              }
            ])
          })
        } as any;
      });

      const { req, res } = mockReqRes({
        user: { id: 'admin-1', role: 'ADMIN' }
      });

      await getAdminLiveSubmissions(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveLength(1);
      expect(res.data.data[0].problemTitle).toBe('Container With Most Water');
      expect(res.data.data[0].verdict).toBe('ACCEPTED');
    });
  });

  // =========================================================================
  // 4. Pending Proposals Queue (getAdminPendingProposals)
  // =========================================================================
  describe('4. getAdminPendingProposals Controller', () => {
    it('lists unreviewed student question proposals', async () => {
      const mockProposals = [
        {
          _id: new mongoose.Types.ObjectId(),
          title: 'Segment Tree Range Queries',
          difficulty: 'HARD',
          status: 'PENDING',
          authorId: 'student_99',
          createdAt: new Date()
        }
      ];

      vi.spyOn(ProblemProposalModel, 'find').mockImplementation(() => {
        return {
          sort: () => ({
            limit: () => ({
              select: () => ({
                lean: () => Promise.resolve(mockProposals)
              })
            })
          })
        } as any;
      });

      const { req, res } = mockReqRes({
        user: { id: 'admin-1', role: 'ADMIN' }
      });

      await getAdminPendingProposals(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveLength(1);
      expect(res.data.data[0].title).toBe('Segment Tree Range Queries');
    });
  });

  // =========================================================================
  // 5. Emergency Cache Flush (flushSystemCache)
  // =========================================================================
  describe('5. flushSystemCache Controller', () => {
    it('flushes redis cache keys and returns deleted count', async () => {
      vi.spyOn(redisClient, 'keys').mockResolvedValue(['cache:problems:item:1', 'cache:problems:item:2']);
      vi.spyOn(redisClient, 'del').mockResolvedValue(2);

      const { req, res } = mockReqRes({
        user: { id: 'admin-1', role: 'ADMIN' }
      });

      await flushSystemCache(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.deletedKeys).toBe(2);
    });
  });

  // =========================================================================
  // 6. Role-Based Access Control (requireRole)
  // =========================================================================
  describe('6. Role-Based Access Control Middleware', () => {
    it('allows ADMIN and INSTRUCTOR to proceed', () => {
      const { req, res } = mockReqRes({ user: { id: 'u1', role: 'ADMIN' } });
      const next = vi.fn();

      const middleware = requireRole('ADMIN', 'INSTRUCTOR');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('rejects regular STUDENT with 403 Forbidden', () => {
      const { req, res } = mockReqRes({ user: { id: 'u2', role: 'STUDENT' } });
      const next = vi.fn();

      const middleware = requireRole('ADMIN', 'INSTRUCTOR');
      middleware(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
