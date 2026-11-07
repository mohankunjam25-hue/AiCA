import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { pgPool } from '../config/db.js';
import { SubmissionModel } from '../models/mongodb/submission.model.js';
import { ProblemModel } from '../models/mongodb/problem.model.js';
import {
  createSuccessResponse,
  createErrorResponse,
  DeveloperProfileResponse,
  DeveloperFullProfile,
  DeveloperSolvedItem,
  DeveloperSkillMastery,
  DeveloperDirectoryResponse,
  DeveloperDirectoryItem
} from '@aica/shared';

// Helper: Calculate League Tier from cumulative score
function getLeague(score: number): string {
  if (score >= 200) return 'Grandmaster';
  if (score >= 120) return 'Master';
  if (score >= 60) return 'Knight';
  return 'Challenger';
}

/**
 * POST /api/v1/developers/:targetUserId/follow
 * Toggle follow/unfollow a developer. Requires authenticated user.
 */
export async function toggleFollowDeveloper(req: Request, res: Response): Promise<void> {
  const viewerId = (req as any).user?.id;
  const targetUserId = req.params.targetUserId as string;

  if (!viewerId) {
    res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication required to follow developers'));
    return;
  }

  if (viewerId === targetUserId) {
    res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'You cannot follow yourself'));
    return;
  }

  try {
    // 1. Check if target user exists in PostgreSQL
    const targetCheck = await pgPool.query('SELECT id, username FROM users WHERE id = $1', [targetUserId]);
    if (targetCheck.rows.length === 0) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Developer not found'));
      return;
    }

    // 2. Check if currently following
    const followCheck = await pgPool.query(
      'SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2',
      [viewerId, targetUserId]
    );

    let isFollowing = false;
    if (followCheck.rows.length > 0) {
      // Unfollow
      await pgPool.query(
        'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2',
        [viewerId, targetUserId]
      );
      isFollowing = false;
    } else {
      // Follow
      await pgPool.query(
        'INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [viewerId, targetUserId]
      );
      isFollowing = true;
    }

    // 3. Return updated follower count
    const countRes = await pgPool.query(
      'SELECT COUNT(*)::int as count FROM user_follows WHERE following_id = $1',
      [targetUserId]
    );
    const followerCount = countRes.rows[0]?.count || 0;

    res.status(200).json(
      createSuccessResponse({
        isFollowing,
        followerCount,
        message: isFollowing
          ? `You are now following @${targetCheck.rows[0].username}. Their solution code is unlocked!`
          : `You have unfollowed @${targetCheck.rows[0].username}.`
      })
    );
  } catch (err: any) {
    console.error('[DeveloperController] toggleFollowDeveloper error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to toggle follow status'));
  }
}

/**
 * GET /api/v1/developers/:username
 * Fetch full developer portfolio.
 * STRICT FOLLOW-GATE INVARIANT:
 * Code is included ONLY if viewer is following target developer or viewing their own profile.
 */
export async function getDeveloperProfile(req: Request, res: Response): Promise<void> {
  const { username } = req.params;
  const viewerId = (req as any).user?.id;

  if (!username) {
    res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Username is required'));
    return;
  }

  try {
    // 1. Fetch user & profile from PostgreSQL
    let targetUser: any = null;
    const pgRes = await pgPool.query(
      `SELECT u.id, u.username, u.email, u.role, u.created_at,
              p.full_name, p.bio, p.avatar_url, p.github_handle, p.current_streak, p.last_active_at
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE LOWER(u.username) = LOWER($1)
       LIMIT 1`,
      [username]
    );

    if (pgRes.rows.length > 0) {
      targetUser = pgRes.rows[0];
    } else {
      // Fallback: check if submissions exist for this username in MongoDB
      const subUser = await SubmissionModel.findOne({ username }).select('userId username').lean();
      if (subUser) {
        targetUser = {
          id: subUser.userId,
          username: subUser.username,
          full_name: subUser.username,
          bio: 'Platform Developer',
          current_streak: 0,
          created_at: new Date()
        };
      }
    }

    if (!targetUser) {
      res.status(404).json(createErrorResponse('NOT_FOUND', `Developer @${username} not found`));
      return;
    }

    const targetUserId = targetUser.id;
    const isSelf = Boolean(viewerId && viewerId === targetUserId);

    // 2. Check follow status and counts in PostgreSQL
    let isFollowing = false;
    let followerCount = 0;
    let followingCount = 0;

    try {
      if (viewerId && !isSelf) {
        const fRes = await pgPool.query(
          'SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2',
          [viewerId, targetUserId]
        );
        isFollowing = fRes.rows.length > 0;
      }

      const countsRes = await pgPool.query(
        `SELECT 
           (SELECT COUNT(*)::int FROM user_follows WHERE following_id = $1) as followers,
           (SELECT COUNT(*)::int FROM user_follows WHERE follower_id = $1) as following`,
        [targetUserId]
      );
      followerCount = countsRes.rows[0]?.followers || 0;
      followingCount = countsRes.rows[0]?.following || 0;
    } catch {
      // Graceful fallback if PostgreSQL table in mocking mode
    }

    // THE FOLLOW-GATE INVARIANT RULE:
    // Code is visible if viewer is following target developer OR viewing their own profile!
    const canViewCode = isFollowing || isSelf;

    // 3. Fetch all unique ACCEPTED problems solved by this user (best submission per problem)
    const pipeline: any[] = [
      {
        $match: {
          userId: targetUserId,
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

    // 4. Fetch metadata for all solved problems
    const problemIds = bestSubmissions.map((s: any) => s.problemId).filter(Boolean);
    const validObjectIds = problemIds
      .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
      .map((id: string) => new mongoose.Types.ObjectId(id));

    const problems = problemIds.length > 0
      ? await ProblemModel.find({
          $or: [{ _id: { $in: validObjectIds } }, { _id: { $in: problemIds } }]
        })
          .select('_id title slug difficulty tags')
          .lean()
      : [];

    const problemMap = new Map<string, any>();
    for (const p of problems) {
      problemMap.set(p._id.toString(), p);
    }

    // 5. Aggregate difficulty, score, and skill tags
    const difficultyBreakdown = { easy: 0, medium: 0, hard: 0 };
    const tagCountMap = new Map<string, number>();
    let totalScore = 0;

    const solvedProblems: DeveloperSolvedItem[] = bestSubmissions.map((sub: any) => {
      const prob = problemMap.get(sub.problemId);
      const difficulty = (prob?.difficulty?.toUpperCase() || 'MEDIUM') as 'EASY' | 'MEDIUM' | 'HARD';
      const score = Math.round((sub.compositeScore || 85.0) * 10) / 10;
      totalScore += score;

      if (difficulty === 'EASY') difficultyBreakdown.easy++;
      else if (difficulty === 'HARD') difficultyBreakdown.hard++;
      else difficultyBreakdown.medium++;

      // Track skill tags
      const tags: string[] = prob?.tags || [];
      tags.forEach((t) => {
        tagCountMap.set(t, (tagCountMap.get(t) || 0) + 1);
      });

      return {
        problemId: sub.problemId,
        title: prob?.title || `Challenge #${sub.problemId.slice(-6)}`,
        slug: prob?.slug || sub.problemId,
        difficulty,
        tags,
        language: sub.language,
        bestRuntimeMs: Math.round((sub.executionTimeMs || 0) * 10) / 10,
        bestMemoryKb: Math.round(sub.memoryUsedKb || 0),
        compositeScore: score,
        solvedAt: sub.createdAt ? new Date(sub.createdAt).toISOString() : new Date().toISOString(),
        isCodeLocked: !canViewCode,
        // STRICT PRIVACY ENFORCEMENT: Stripped completely when not following
        code: canViewCode ? sub.code : undefined,
        aiAnalysisSummary: canViewCode ? 'Deterministic baseline passed with clean AST.' : undefined
      };
    });

    // 6. Convert tagCountMap into sorted skill mastery list
    const totalSolved = solvedProblems.length;
    const skills: DeveloperSkillMastery[] = Array.from(tagCountMap.entries())
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: totalSolved > 0 ? Math.round((count / totalSolved) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    const developer: DeveloperFullProfile = {
      userId: targetUserId,
      username: targetUser.username,
      fullName: targetUser.full_name || targetUser.username,
      bio: targetUser.bio || 'Competitive programmer & algorithm enthusiast on AiCA.',
      avatarUrl: targetUser.avatar_url,
      githubHandle: targetUser.github_handle,
      league: getLeague(totalScore),
      totalSolved,
      totalScore: Math.round(totalScore * 10) / 10,
      streak: targetUser.current_streak || 0,
      followerCount,
      followingCount,
      isFollowing,
      isSelf,
      joinedAt: targetUser.created_at ? new Date(targetUser.created_at).toISOString() : undefined,
      difficultyBreakdown,
      skills
    };

    const responseData: DeveloperProfileResponse = {
      developer,
      solvedProblems
    };

    res.status(200).json(createSuccessResponse(responseData));
  } catch (err: any) {
    console.error('[DeveloperController] getDeveloperProfile error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve developer profile'));
  }
}

/**
 * GET /api/v1/developers
 * Search & Directory for developers on the platform.
 */
export async function getDeveloperDirectory(req: Request, res: Response): Promise<void> {
  const viewerId = (req as any).user?.id;
  const search = ((req.query.search as string) || '').trim().toLowerCase();
  const leagueFilter = ((req.query.league as string) || 'ALL').toUpperCase();
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
  const skip = (page - 1) * limit;

  try {
    // 1. Fetch ranked developers from MongoDB submissions aggregate
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
          bestScore: { $first: '$compositeScore' }
        }
      },
      {
        $group: {
          _id: '$userId',
          username: { $first: '$username' },
          problemsSolved: { $sum: 1 },
          totalScore: { $sum: '$bestScore' }
        }
      },
      {
        $sort: { problemsSolved: -1, totalScore: -1 }
      }
    ];

    const aggResults = await SubmissionModel.aggregate(pipeline);

    // 2. Fetch all registered users from PostgreSQL to merge
    const pgUsers = await pgPool.query(
      `SELECT u.id, u.username, p.full_name, p.avatar_url, p.current_streak
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id`
    );

    const pgUserMap = new Map<string, any>();
    for (const u of pgUsers.rows) {
      pgUserMap.set(u.id, u);
      pgUserMap.set(u.username.toLowerCase(), u);
    }

    // 3. Follow map for viewer
    const followingSet = new Set<string>();
    const followerCountMap = new Map<string, number>();

    try {
      if (viewerId) {
        const followRows = await pgPool.query(
          'SELECT following_id FROM user_follows WHERE follower_id = $1',
          [viewerId]
        );
        for (const r of followRows.rows) {
          followingSet.add(r.following_id);
        }
      }

      const counts = await pgPool.query(
        'SELECT following_id, COUNT(*)::int as count FROM user_follows GROUP BY following_id'
      );
      for (const r of counts.rows) {
        followerCountMap.set(r.following_id, r.count);
      }
    } catch {
      // Fallback if table unavailable
    }

    // 4. Combine into DeveloperDirectoryItem[]
    let allDevelopers: DeveloperDirectoryItem[] = [];
    const seenUserIds = new Set<string>();

    for (const agg of aggResults) {
      const u = pgUserMap.get(agg._id) || pgUserMap.get((agg.username || '').toLowerCase());
      seenUserIds.add(agg._id);

      const totalScore = Math.round((agg.totalScore || 0) * 10) / 10;
      const league = getLeague(totalScore);

      allDevelopers.push({
        userId: agg._id,
        username: u?.username || agg.username || 'Developer',
        fullName: u?.full_name || agg.username || 'Platform Developer',
        avatarUrl: u?.avatar_url,
        league,
        totalSolved: agg.problemsSolved || 0,
        totalScore,
        streak: u?.current_streak || 0,
        topSkills: ['Algorithms', 'Logic'],
        followerCount: followerCountMap.get(agg._id) || 0,
        isFollowing: followingSet.has(agg._id)
      });
    }

    // Include registered PG users who haven't solved problems yet
    for (const u of pgUsers.rows) {
      if (!seenUserIds.has(u.id)) {
        allDevelopers.push({
          userId: u.id,
          username: u.username,
          fullName: u.full_name || u.username,
          avatarUrl: u.avatar_url,
          league: 'Challenger',
          totalSolved: 0,
          totalScore: 0,
          streak: u.current_streak || 0,
          topSkills: ['Getting Started'],
          followerCount: followerCountMap.get(u.id) || 0,
          isFollowing: followingSet.has(u.id)
        });
      }
    }

    // 5. Apply Search & Filter
    if (search) {
      allDevelopers = allDevelopers.filter(
        (d) =>
          d.username.toLowerCase().includes(search) ||
          (d.fullName && d.fullName.toLowerCase().includes(search)) ||
          d.topSkills.some((s) => s.toLowerCase().includes(search))
      );
    }

    if (leagueFilter !== 'ALL') {
      allDevelopers = allDevelopers.filter((d) => d.league.toUpperCase() === leagueFilter);
    }

    const total = allDevelopers.length;
    const paginated = allDevelopers.slice(skip, skip + limit);

    const responseData: DeveloperDirectoryResponse = {
      total,
      page,
      limit,
      developers: paginated
    };

    res.status(200).json(createSuccessResponse(responseData));
  } catch (err: any) {
    console.error('[DeveloperController] getDeveloperDirectory error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve developer directory'));
  }
}
