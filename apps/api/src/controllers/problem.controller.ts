
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ProblemModel } from '../models/mongodb/problem.model.js';
import { SubmissionModel } from '../models/mongodb/submission.model.js';
import { CacheService } from '../services/cache.service.js';
import {
  createSuccessResponse,
  createErrorResponse,
  ProblemCreateSchema,
  ProblemUpdateSchema,
  ProblemQuerySchema,
  ProblemListItem
} from '@aica/shared';

function checkMongoReady(res: Response): boolean {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json(
      createErrorResponse(
        'SERVICE_UNAVAILABLE',
        'Database connection to MongoDB is unavailable. Please verify MONGODB_URI in your environment settings.'
      )
    );
    return false;
  }
  return true;
}

export async function getProblems(req: Request, res: Response): Promise<void> {
  if (!checkMongoReady(res)) return;

  const parseQuery = ProblemQuerySchema.safeParse(req.query);
  if (!parseQuery.success) {
    res.status(400).json(
      createErrorResponse('VALIDATION_ERROR', 'Invalid problem query parameters', [
        { field: 'query', issue: parseQuery.error.errors.map((e) => e.message).join(', ') }
      ])
    );
    return;
  }

  try {
    const { page, limit, difficulty, tag, search, sortBy } = parseQuery.data;
    const skip = (page - 1) * limit;

    // Check Redis Cache if unauthenticated or general view (< 2ms)
    const userId = req.user?.id;
    const cacheKey = `cache:problems:list:${JSON.stringify(parseQuery.data)}`;
    if (!userId) {
      const cached = await CacheService.get<any>(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
        res.status(200).json(createSuccessResponse(cached));
        return;
      }
    }

    const filter: Record<string, any> = {
      // Only serve PUBLISHED problems to general catalog (or legacy unmigrated problems)
      status: { $in: ['PUBLISHED', null] }
    };

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (tag && tag.trim()) {
      filter.tags = tag.trim();
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (sortBy === 'difficulty_asc') {
      sortOption = { difficulty: 1, createdAt: -1 };
    } else if (sortBy === 'difficulty_desc') {
      sortOption = { difficulty: -1, createdAt: -1 };
    } else if (sortBy === 'title_asc') {
      sortOption = { title: 1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    const [problems, total] = await Promise.all([
      ProblemModel.find(filter)
        .select(
          'title slug difficulty tags totalSubmissions acceptedSubmissions'
        )
        .skip(skip)
        .limit(limit)
        .sort(sortOption)
        .lean(),

      ProblemModel.countDocuments(filter)
    ]);

    const userProblemStatusMap = new Map<string, 'SOLVED' | 'ATTEMPTED' | 'TODO'>();

    if (userId && problems.length > 0) {
      const problemIds = problems.map((p: any) => p._id.toString());
      try {
        const userSubs = await SubmissionModel.find({
          userId,
          problemId: { $in: problemIds },
          isTestRun: false
        })
          .select('problemId verdict')
          .lean();

        for (const sub of userSubs) {
          const pId = sub.problemId;
          if (sub.verdict === 'ACCEPTED') {
            userProblemStatusMap.set(pId, 'SOLVED');
          } else if (!userProblemStatusMap.has(pId) || userProblemStatusMap.get(pId) !== 'SOLVED') {
            userProblemStatusMap.set(pId, 'ATTEMPTED');
          }
        }
      } catch (subErr: any) {
        console.warn('[ProblemController] Failed to annotate user problem status:', subErr.message);
      }
    }

    const formattedList: ProblemListItem[] = problems.map((p: any) => {
      const pId = p._id.toString();
      return {
        id: pId,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        tags: p.tags || [],
        totalSubmissions: p.totalSubmissions || 0,
        acceptanceRate:
          p.totalSubmissions > 0
            ? Math.round((p.acceptedSubmissions / p.totalSubmissions) * 1000) / 10
            : 0,
        userStatus: userId ? (userProblemStatusMap.get(pId) || 'TODO') : undefined
      };
    });

    const responseData = {
      problems: formattedList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    if (!userId) {
      await CacheService.set(cacheKey, responseData, 60);
    }

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    res.status(200).json(createSuccessResponse(responseData));

  } catch (err: any) {
    console.error('[ProblemController] getProblems error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve problems', [{ issue: err.message }]));
  }
}

export async function getProblemById(req: Request, res: Response): Promise<void> {
  if (!checkMongoReady(res)) return;

  const idParam = req.params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!id) {
    res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Problem identifier is required'));
    return;
  }

  try {
    const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'INSTRUCTOR';
    const cacheKey = `cache:problems:item:${id}`;

    if (!isStaff) {
      const cached = await CacheService.get<any>(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        res.status(200).json(createSuccessResponse(cached));
        return;
      }
    }

    // Support dual lookup: by MongoDB ObjectId OR URL-friendly slug
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };
    const problem: any = await ProblemModel.findOne(query).lean();

    if (!problem || (problem.status && problem.status !== 'PUBLISHED' && !isStaff)) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Problem not found or unpublished'));
      return;
    }

    // Sanitize test cases: strictly return only public test cases to students
    const publicTestCases = (problem.testCases || [])
      .filter((tc: any) => tc.isPublic === true)
      .map((tc: any) => ({
        id: tc.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        explanation: tc.explanation,
        isPublic: true
      }));

    const sanitizedProblem: any = {
      ...problem,
      id: problem._id.toString(),
      testCases: publicTestCases,

      acceptanceRate:
        problem.totalSubmissions > 0
          ? Math.round(
              (problem.acceptedSubmissions / problem.totalSubmissions) * 1000
            ) / 10
          : 0
    };

    delete sanitizedProblem._id;
    delete sanitizedProblem.__v;

    if (!isStaff) {
      await CacheService.set(cacheKey, sanitizedProblem, 300);
    }

    res.setHeader('X-Cache', 'MISS');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.status(200).json(
      createSuccessResponse(sanitizedProblem)
    );

  } catch (err: any) {
    console.error('[ProblemController] getProblemById error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve problem', [{ issue: err.message }]));
  }
}

export async function createProblem(req: Request, res: Response): Promise<void> {
  if (!checkMongoReady(res)) return;

  const parseResult = ProblemCreateSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(422).json(
      createErrorResponse(
        'VALIDATION_ERROR',
        'Invalid problem schema',
        [
          {
            field: 'form',
            issue: parseResult.error.errors
              .map((e) => e.message)
              .join(', ')
          }
        ]
      )
    );

    return;
  }

  try {
    const data = parseResult.data;

    const userId = req.user?.id || 'admin';

    // Unique slug check
    const existing = await ProblemModel.findOne({ slug: data.slug });
    if (existing) {
      res.status(409).json(
        createErrorResponse('CONFLICT', `A problem with slug "${data.slug}" already exists`)
      );
      return;
    }

    // Backend pre-publish validation: minimum 1 public + 1 hidden test case
    if (data.status === 'PUBLISHED') {
      const hasPublic = (data.testCases || []).some((tc) => tc.isPublic === true);
      const hasHidden = (data.testCases || []).some((tc) => tc.isPublic === false || tc.isPublic === undefined);
      if (!hasPublic || !hasHidden) {
        res.status(422).json(
          createErrorResponse(
            'VALIDATION_ERROR',
            'Cannot publish problem: at least 1 public test case and 1 hidden test case are required before publishing.'
          )
        );
        return;
      }
    }

    // Generate unique backend IDs for test cases if omitted
    const processedTestCases = (data.testCases || []).map((tc, idx) => ({
      ...tc,
      id: tc.id && tc.id.trim() ? tc.id : `tc-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 7)}`
    }));

    const newProblem = await ProblemModel.create({
      ...data,
      testCases: processedTestCases,
      createdBy: userId
    });

    // Invalidate problem catalog caches
    await CacheService.invalidatePattern('cache:problems:*');

    res.status(201).json(
      createSuccessResponse(
        newProblem,
        'Problem created successfully'
      )
    );

  } catch (err: any) {
    console.error('[ProblemController] createProblem error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to create problem', [{ issue: err.message }]));
  }
}

export async function updateProblem(req: Request, res: Response): Promise<void> {
  if (!checkMongoReady(res)) return;

  const idParam = req.params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!id) {
    res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Problem identifier is required'));
    return;
  }

  const parseResult = ProblemUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(422).json(
      createErrorResponse('VALIDATION_ERROR', 'Invalid problem update schema', [
        { field: 'form', issue: parseResult.error.errors.map((e) => e.message).join(', ') }
      ])
    );
    return;
  }

  try {
    const updateData = parseResult.data;
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };
    const problem = await ProblemModel.findOne(query);

    if (!problem) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Target problem not found'));
      return;
    }

    // Check slug uniqueness if slug is being updated
    if (updateData.slug && updateData.slug !== problem.slug) {
      const existingSlug = await ProblemModel.findOne({
        slug: updateData.slug,
        _id: { $ne: problem._id }
      });
      if (existingSlug) {
        res.status(409).json(
          createErrorResponse('CONFLICT', `A problem with slug "${updateData.slug}" already exists`)
        );
        return;
      }
    }

    // Pre-publish validation on backend: minimum 1 public + 1 hidden test case
    const targetStatus = updateData.status !== undefined ? updateData.status : problem.status;
    const targetTestCases = updateData.testCases !== undefined ? updateData.testCases : problem.testCases;

    if (targetStatus === 'PUBLISHED') {
      const hasPublic = (targetTestCases || []).some((tc: any) => tc.isPublic === true);
      const hasHidden = (targetTestCases || []).some((tc: any) => tc.isPublic === false || tc.isPublic === undefined);
      if (!hasPublic || !hasHidden) {
        res.status(422).json(
          createErrorResponse(
            'VALIDATION_ERROR',
            'Cannot publish problem: at least 1 public test case and 1 hidden test case are required before publishing.'
          )
        );
        return;
      }
    }

    // Ensure test cases have IDs if being updated
    if (updateData.testCases) {
      updateData.testCases = updateData.testCases.map((tc, idx) => ({
        ...tc,
        id: tc.id && tc.id.trim() ? tc.id : `tc-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 7)}`
      }));
    }

    const updated = await ProblemModel.findByIdAndUpdate(
      problem._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Invalidate problem catalog caches
    await CacheService.invalidatePattern('cache:problems:*');

    res.status(200).json(createSuccessResponse(updated, 'Problem updated successfully'));
  } catch (err: any) {
    console.error('[ProblemController] updateProblem error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to update problem', [{ issue: err.message }]));
  }
}

export async function deleteProblem(req: Request, res: Response): Promise<void> {
  if (!checkMongoReady(res)) return;

  const idParam = req.params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!id) {
    res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Problem identifier is required'));
    return;
  }

  try {
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };
    const problem = await ProblemModel.findOne(query);

    if (!problem) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Target problem not found'));
      return;
    }

    // Soft-delete/Archive: preserves all historical student submissions, streaks, and heatmap data
    await ProblemModel.findByIdAndUpdate(problem._id, { $set: { status: 'ARCHIVED' } });

    // Invalidate problem catalog caches
    await CacheService.invalidatePattern('cache:problems:*');

    res.status(200).json(
      createSuccessResponse(
        { id: problem._id.toString(), slug: problem.slug, status: 'ARCHIVED' },
        'Problem archived successfully. Historical submissions preserved.'
      )
    );
  } catch (err: any) {
    console.error('[ProblemController] deleteProblem error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to archive problem', [{ issue: err.message }]));
  }
}

export async function getAdminProblems(req: Request, res: Response): Promise<void> {
  if (!checkMongoReady(res)) return;

  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (req.query.status) {
      filter.status = (req.query.status as string).toUpperCase();
    }
    if (req.query.difficulty) {
      filter.difficulty = (req.query.difficulty as string).toUpperCase();
    }

    const [problems, total] = await Promise.all([
      ProblemModel.find(filter)
        .select('title slug difficulty status tags totalSubmissions acceptedSubmissions createdAt updatedAt')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      ProblemModel.countDocuments(filter)
    ]);

    const formatted = problems.map((p: any) => ({
      id: p._id.toString(),
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      status: p.status || 'UNPUBLISHED',
      tags: p.tags || [],
      totalSubmissions: p.totalSubmissions || 0,
      acceptedSubmissions: p.acceptedSubmissions || 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    res.status(200).json(
      createSuccessResponse({
        problems: formatted,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      })
    );
  } catch (err: any) {
    console.error('[ProblemController] getAdminProblems error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve admin problem catalog', [{ issue: err.message }]));
  }
}

export async function getAdminProblemById(req: Request, res: Response): Promise<void> {
  if (!checkMongoReady(res)) return;

  const idParam = req.params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!id) {
    res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Problem identifier is required'));
    return;
  }

  try {
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };
    const problem: any = await ProblemModel.findOne(query).lean();

    if (!problem) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Target problem not found'));
      return;
    }

    // For authorized instructors and admins: return full problem document including hidden test cases
    const fullProblem = {
      ...problem,
      id: problem._id.toString()
    };
    delete fullProblem._id;
    delete fullProblem.__v;

    res.status(200).json(createSuccessResponse(fullProblem));
  } catch (err: any) {
    console.error('[ProblemController] getAdminProblemById error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve full problem', [{ issue: err.message }]));
  }
}
