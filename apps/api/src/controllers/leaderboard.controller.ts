import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { SubmissionModel } from '../models/mongodb/submission.model.js';
import { ProblemModel } from '../models/mongodb/problem.model.js';
import { EvaluationReportModel } from '../models/mongodb/evaluation-report.model.js';
import { pgPool } from '../config/db.js';
import { CacheService } from '../services/cache.service.js';
import {
  createSuccessResponse,
  createErrorResponse,
  LeaderboardEntry,
  ProblemLeaderboardResponse,
  GlobalLeaderboardEntry,
  GlobalLeaderboardResponse,
  DeveloperSolvedProblemItem,
  DeveloperSolvedProfile,
  DeveloperSolvedResponse
} from '@aica/shared';

export async function getProblemLeaderboard(req: Request, res: Response): Promise<void> {
  const { problemId } = req.params;
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 25));
  const skip = (page - 1) * limit;

  // 1. Check Redis Cache First (< 2ms)
  const cacheKey = `cache:leaderboard:problem:${problemId}:${page}:${limit}`;
  const cached = await CacheService.get<ProblemLeaderboardResponse>(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    res.status(200).json(createSuccessResponse(cached));
    return;
  }

  try {
    // Correctness Gate: ONLY ACCEPTED submissions are eligible for leaderboard ranking!
    const matchQuery = {
      problemId,
      verdict: 'ACCEPTED',
      isTestRun: false
    };

    // Deduplicate by userId: Each student appears at most once with their best composite score
    const pipeline: any[] = [
      { $match: matchQuery },
      { $sort: { compositeScore: -1, normalizedTimeMs: 1, memoryUsedKb: 1, createdAt: 1 } },
      {
        $group: {
          _id: '$userId',
          bestSubmission: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$bestSubmission' } },
      { $sort: { compositeScore: -1, normalizedTimeMs: 1, memoryUsedKb: 1, createdAt: 1 } },
      {
        $facet: {
          rankings: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: 'count' }]
        }
      }
    ];

    const aggResult = await SubmissionModel.aggregate(pipeline);
    const submissions = aggResult[0]?.rankings || [];
    const totalRanked = aggResult[0]?.totalCount[0]?.count || 0;

    const rankings: LeaderboardEntry[] = await Promise.all(
      submissions.map(async (sub: any, index: number) => {
        // Fetch AI quality score from evaluation report if available
        let qualityScore = 7.5;
        const report = await EvaluationReportModel.findOne({ submissionId: sub._id.toString() }).lean();
        if (report && report.aiAnalysis?.codeQuality?.score) {
          qualityScore = report.aiAnalysis.codeQuality.score;
        }

        const timeScore = Math.max(0, 100 - sub.normalizedTimeMs);
        const memScore = Math.max(0, 100 - Math.round(sub.memoryUsedKb / 1024));
        const qualityPoints = qualityScore * 10;

        return {
          rank: skip + index + 1,
          userId: sub.userId,
          username: sub.username || 'Anonymous',
          submissionId: sub._id.toString(),
          language: sub.language,
          compositeScore: sub.compositeScore || 85.0,
          breakdown: {
            rawTimeMs: sub.executionTimeMs,
            normalizedTimeMs: sub.normalizedTimeMs,
            timeScore: Math.round(timeScore * 10) / 10,
            rawMemoryKb: sub.memoryUsedKb,
            normalizedMemoryKb: Math.max(1024, sub.memoryUsedKb - 12000),
            memoryScore: Math.round(memScore * 10) / 10,
            qualityScore,
            qualityPoints: Math.round(qualityPoints * 10) / 10,
            formula: '0.50 * Stime + 0.30 * Smem + 0.20 * Squality'
          },
          submittedAt: sub.createdAt ? new Date(sub.createdAt).toISOString() : new Date().toISOString()
        };
      })
    );

    const responseData: ProblemLeaderboardResponse = {
      problemId: problemId as string,
      totalRanked,
      rankings
    };

    // Cache in Redis for 30 seconds
    await CacheService.set(cacheKey, responseData, 30);

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    res.status(200).json(createSuccessResponse(responseData));
  } catch (err: any) {
    console.error('[LeaderboardController] getProblemLeaderboard error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve leaderboard'));
  }
}

export async function getGlobalLeaderboard(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 25));
  const skip = (page - 1) * limit;

  // 1. Check Redis Cache First (< 2ms)
  const cacheKey = `cache:leaderboard:global:${page}:${limit}`;
  const cached = await CacheService.get<GlobalLeaderboardResponse>(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    res.status(200).json(createSuccessResponse(cached));
    return;
  }

  try {
    // 1. Aggregation pipeline across all problems
    // First, deduplicate each user's submissions per problem to retain only their best score
    const pipeline: any[] = [
      {
        $match: {
          verdict: 'ACCEPTED',
          isTestRun: false
        }
      },
      {
        $sort: { compositeScore: -1, normalizedTimeMs: 1, createdAt: 1 }
      },
      {
        $group: {
          _id: { userId: '$userId', problemId: '$problemId' },
          userId: { $first: '$userId' },
          username: { $first: '$username' },
          bestScore: { $first: '$compositeScore' },
          bestTimeMs: { $first: '$executionTimeMs' },
          submittedAt: { $first: '$createdAt' }
        }
      },
      {
        $group: {
          _id: '$userId',
          username: { $first: '$username' },
          problemsSolved: { $sum: 1 },
          totalScore: { $sum: '$bestScore' },
          avgRuntimeMs: { $avg: '$bestTimeMs' },
          lastActiveAt: { $max: '$submittedAt' }
        }
      },
      {
        $sort: { problemsSolved: -1, totalScore: -1, avgRuntimeMs: 1 }
      },
      {
        $facet: {
          rankings: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: 'count' }]
        }
      }
    ];

    const aggResult = await SubmissionModel.aggregate(pipeline);
    const rankingsRaw = aggResult[0]?.rankings || [];
    const totalRanked = aggResult[0]?.totalCount[0]?.count || 0;

    // 2. Enrich with PostgreSQL avatar & streak data if available
    const userIds = rankingsRaw.map((r: any) => r._id);
    const profileMap = new Map<string, { avatarUrl?: string; streak: number }>();

    if (userIds.length > 0) {
      try {
        const pgRes = await pgPool.query(
          'SELECT user_id, avatar_url, current_streak FROM user_profiles WHERE user_id = ANY($1)',
          [userIds]
        );
        for (const row of pgRes.rows) {
          profileMap.set(row.user_id, {
            avatarUrl: row.avatar_url,
            streak: row.current_streak || 0
          });
        }
      } catch (pgErr: any) {
        // Fallback gracefully if PostgreSQL is unreachable or running mocked
      }
    }

    const formattedRankings: GlobalLeaderboardEntry[] = rankingsRaw.map((u: any, index: number) => {
      const p = profileMap.get(u._id);
      return {
        rank: skip + index + 1,
        userId: u._id,
        username: u.username || 'Anonymous',
        avatarUrl: p?.avatarUrl,
        problemsSolved: u.problemsSolved || 0,
        totalScore: Math.round((u.totalScore || 0) * 10) / 10,
        avgRuntimeMs: Math.round((u.avgRuntimeMs || 0) * 10) / 10,
        streak: p?.streak || 0,
        lastActiveAt: u.lastActiveAt ? new Date(u.lastActiveAt).toISOString() : undefined
      };
    });

    const responseData: GlobalLeaderboardResponse = {
      totalRanked,
      page,
      limit,
      rankings: formattedRankings
    };

    // Cache in Redis for 30 seconds
    await CacheService.set(cacheKey, responseData, 30);

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    res.status(200).json(createSuccessResponse(responseData));
  } catch (err: any) {
    console.error('[LeaderboardController] getGlobalLeaderboard error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve global leaderboard'));
  }
}

export async function getUserSolvedProblems(req: Request, res: Response): Promise<void> {
  const userId = req.params.userId as string;

  if (!userId) {
    res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'User ID is required'));
    return;
  }

  // 1. Check Redis Cache First (< 2ms)
  const cacheKey = `cache:leaderboard:user:${userId}:solved`;
  const cached = await CacheService.get<DeveloperSolvedResponse>(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    res.status(200).json(createSuccessResponse(cached));
    return;
  }

  try {
    // 1. Aggregation: Find all unique ACCEPTED problems solved by this user, taking their best submission per problem
    const pipeline: any[] = [
      {
        $match: {
          userId,
          verdict: 'ACCEPTED',
          isTestRun: false
        }
      },
      {
        $sort: { compositeScore: -1, normalizedTimeMs: 1, createdAt: 1 }
      },
      {
        $group: {
          _id: '$problemId',
          bestSubmission: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$bestSubmission' }
      },
      {
        $sort: { createdAt: -1 }
      }
    ];

    const bestSubmissions = await SubmissionModel.aggregate(pipeline);

    // 2. Fetch metadata for all solved problems
    const problemIds = bestSubmissions.map((sub: any) => sub.problemId).filter(Boolean);
    const validObjectIds = problemIds
      .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
      .map((id: string) => new mongoose.Types.ObjectId(id));

    const problems = problemIds.length > 0
      ? await ProblemModel.find({
          $or: [
            { _id: { $in: validObjectIds } },
            { _id: { $in: problemIds } }
          ]
        }).select('_id title slug difficulty tags').lean()
      : [];

    const problemMap = new Map<string, any>();
    for (const p of problems) {
      problemMap.set(p._id.toString(), p);
    }

    // 3. Enrich PostgreSQL user details (username, avatar, streak)
    let pgUsername: string | undefined;
    let pgAvatarUrl: string | undefined;
    let pgStreak = 0;

    try {
      const pgRes = await pgPool.query(
        `SELECT u.username, p.avatar_url, p.current_streak
         FROM users u
         LEFT JOIN user_profiles p ON u.id = p.user_id
         WHERE u.id = $1`,
        [userId]
      );
      if (pgRes.rows.length > 0) {
        pgUsername = pgRes.rows[0].username;
        pgAvatarUrl = pgRes.rows[0].avatar_url;
        pgStreak = pgRes.rows[0].current_streak || 0;
      }
    } catch (pgErr) {
      // PostgreSQL fallback if disconnected
    }

    const fallbackUsername = bestSubmissions[0]?.username || 'Developer';
    const username = pgUsername || fallbackUsername;

    // 4. Compute difficulty breakdown & format solved problem list
    const difficultyBreakdown = { easy: 0, medium: 0, hard: 0 };
    let totalScore = 0;

    const solvedProblems: DeveloperSolvedProblemItem[] = bestSubmissions.map((sub: any) => {
      const prob = problemMap.get(sub.problemId);
      const difficulty = (prob?.difficulty?.toUpperCase() || 'MEDIUM') as 'EASY' | 'MEDIUM' | 'HARD';
      const score = Math.round((sub.compositeScore || 85.0) * 10) / 10;
      totalScore += score;

      if (difficulty === 'EASY') difficultyBreakdown.easy++;
      else if (difficulty === 'HARD') difficultyBreakdown.hard++;
      else difficultyBreakdown.medium++;

      return {
        problemId: sub.problemId,
        title: prob?.title || `Challenge #${sub.problemId.slice(-6)}`,
        slug: prob?.slug || sub.problemId,
        difficulty,
        tags: prob?.tags || [],
        language: sub.language,
        bestRuntimeMs: Math.round((sub.executionTimeMs || 0) * 10) / 10,
        bestMemoryKb: Math.round(sub.memoryUsedKb || 0),
        compositeScore: score,
        solvedAt: sub.createdAt ? new Date(sub.createdAt).toISOString() : new Date().toISOString()
      };
    });

    // 5. Determine League Tier
    const getLeague = (pts: number) => {
      if (pts >= 200) return 'Grandmaster';
      if (pts >= 120) return 'Master';
      if (pts >= 60) return 'Knight';
      return 'Challenger';
    };

    const developer: DeveloperSolvedProfile = {
      userId,
      username,
      avatarUrl: pgAvatarUrl,
      league: getLeague(totalScore),
      totalSolved: solvedProblems.length,
      totalScore: Math.round(totalScore * 10) / 10,
      streak: pgStreak,
      difficultyBreakdown
    };

    const responseData: DeveloperSolvedResponse = {
      developer,
      solvedProblems
    };

    // Cache in Redis for 60 seconds
    await CacheService.set(cacheKey, responseData, 60);

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    res.status(200).json(createSuccessResponse(responseData));
  } catch (err: any) {
    console.error('[LeaderboardController] getUserSolvedProblems error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve developer solved problems'));
  }
}

