import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  createSuccessResponse,
  createErrorResponse,
  PracticeProblemCreateSchema,
  PracticeProblemUpdateSchema,
  PracticeProblemForkSchema,
  ProblemListItem
} from '@aica/shared';
import { ProblemModel } from '../models/mongodb/problem.model.js';
import { SubmissionModel } from '../models/mongodb/submission.model.js';
import { GeminiAnalysisClient } from '@aica/ai-engine';

export const practiceGeminiClient = new GeminiAnalysisClient();

function checkMongoReady(res: Response): boolean {
  if (ProblemModel.base.connection.readyState !== 1 && mongoose.connection.readyState !== 1) {
    res.status(503).json(
      createErrorResponse('DATABASE_UNAVAILABLE', 'Primary database connection is offline. Please retry shortly.')
    );
    return false;
  }
  return true;
}

function generateSafeSlug(title: string, userSuffix?: string): string {
  const base = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'practice-problem';
  
  const rand = Math.random().toString(36).substring(2, 6);
  const suffix = userSuffix ? `${userSuffix.slice(-4)}-${rand}` : rand;
  return `${base}-${suffix}`;
}

export async function createPracticeProblem(req: Request, res: Response): Promise<void> {
  if (!checkMongoReady(res)) return;

  const parseResult = PracticeProblemCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(422).json(
      createErrorResponse('VALIDATION_ERROR', 'Invalid practice problem data', [
        { field: 'body', issue: parseResult.error.errors.map((e) => e.message).join(', ') }
      ])
    );
    return;
  }

  try {
    const data = parseResult.data;
    const userId = req.user?.id || 'anonymous_student';
    const username = req.user?.username || 'Student';
    const role = req.user?.role || 'STUDENT';

    let slug = data.slug;
    if (!slug) {
      slug = generateSafeSlug(data.title, userId);
    } else {
      const existing = await ProblemModel.findOne({ slug });
      if (existing) {
        slug = generateSafeSlug(data.slug || data.title, userId);
      }
    }

    const processedTestCases = data.testCases.map((tc, idx) => ({
      ...tc,
      id: tc.id && tc.id.trim() ? tc.id : `tc-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
      weight: tc.weight || 1.0,
      isPublic: tc.isPublic !== undefined ? tc.isPublic : idx < 2
    }));

    const newProblem = await ProblemModel.create({
      title: data.title,
      slug,
      status: 'PRACTICE',
      isCustomPractice: true,
      practiceVisibility: data.practiceVisibility || 'PRIVATE',
      version: 1,
      difficulty: data.difficulty,
      tags: data.tags && data.tags.length > 0 ? data.tags : ['Practice'],
      description: data.description,
      constraints: data.constraints || [],
      examples: data.examples || [],
      timeLimitMs: data.timeLimitMs || 2000,
      memoryLimitKb: data.memoryLimitKb || 262144,
      starterCode: data.starterCode || {},
      testCases: processedTestCases,
      createdBy: userId,
      authorMetadata: {
        username,
        role: role as any,
        isAIAssisted: Boolean(data.isAIAssisted)
      }
    });

    res.status(201).json(createSuccessResponse(newProblem, 'Practice problem created successfully!'));
  } catch (err: any) {
    console.error('[PracticeProblemController] createPracticeProblem error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to create practice problem', [{ issue: err.message }]));
  }
}

export async function getMyPracticeProblems(req: Request, res: Response): Promise<void> {
  if (!checkMongoReady(res)) return;

  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json(createErrorResponse('UNAUTHORIZED', 'Authentication required to view your practice problems'));
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      createdBy: userId,
      isCustomPractice: true
    };

    if (req.query.difficulty && req.query.difficulty !== 'ALL') {
      filter.difficulty = req.query.difficulty;
    }

    if (req.query.tag && req.query.tag !== 'All Topics') {
      filter.tags = req.query.tag;
    }

    if (req.query.search && typeof req.query.search === 'string' && req.query.search.trim()) {
      const regex = { $regex: req.query.search.trim(), $options: 'i' };
      filter.$and = [{ $or: [{ title: regex }, { description: regex }] }];
    }

    const [problems, total] = await Promise.all([
      ProblemModel.find(filter)
        .select('title slug difficulty tags status isCustomPractice practiceVisibility authorMetadata totalSubmissions acceptedSubmissions testCases createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProblemModel.countDocuments(filter)
    ]);

    // Annotate solving status for the student
    const problemIds = problems.map((p: any) => p._id.toString());
    const metricsMap = new Map<string, { status: 'SOLVED' | 'ATTEMPTED'; bestRuntimeMs?: number; lastVerdict?: string }>();

    if (problemIds.length > 0) {
      try {
        const subs = await SubmissionModel.find({
          userId,
          problemId: { $in: problemIds },
          isTestRun: false
        })
          .sort({ createdAt: -1 })
          .select('problemId verdict executionTimeMs')
          .lean();

        for (const pId of problemIds) {
          const problemSubs = subs.filter((s: any) => s.problemId === pId);
          if (problemSubs.length === 0) continue;

          const accepted = problemSubs.filter((s: any) => s.verdict === 'ACCEPTED');
          if (accepted.length > 0) {
            let minTime = Infinity;
            for (const acc of accepted) {
              if (acc.executionTimeMs && acc.executionTimeMs < minTime) {
                minTime = acc.executionTimeMs;
              }
            }
            metricsMap.set(pId, {
              status: 'SOLVED',
              bestRuntimeMs: minTime !== Infinity ? minTime : undefined
            });
          } else {
            metricsMap.set(pId, {
              status: 'ATTEMPTED',
              lastVerdict: problemSubs[0]?.verdict
            });
          }
        }
      } catch (err: any) {
        console.warn('[PracticeProblemController] Metrics lookup warning:', err.message);
      }
    }

    const formattedList: ProblemListItem[] = problems.map((p: any) => {
      const pId = p._id.toString();
      const metric = metricsMap.get(pId);
      return {
        id: pId,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        tags: p.tags || [],
        totalSubmissions: p.totalSubmissions || 0,
        acceptanceRate: p.totalSubmissions > 0 ? Math.round((p.acceptedSubmissions / p.totalSubmissions) * 1000) / 10 : 0,
        userStatus: metric ? metric.status : 'TODO',
        bestRuntimeMs: metric?.bestRuntimeMs,
        lastVerdict: metric?.lastVerdict,
        isCustomPractice: p.isCustomPractice,
        practiceVisibility: p.practiceVisibility,
        authorMetadata: p.authorMetadata,
        totalTestCases: (p.testCases || []).length
      };
    });

    res.status(200).json(
      createSuccessResponse({
        problems: formattedList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    );
  } catch (err: any) {
    console.error('[PracticeProblemController] getMyPracticeProblems error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve practice problems'));
  }
}

export async function updatePracticeProblem(req: Request, res: Response): Promise<void> {
  if (!checkMongoReady(res)) return;

  const idParam = req.params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!id) {
    res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Problem ID is required'));
    return;
  }

  const parseResult = PracticeProblemUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(422).json(
      createErrorResponse('VALIDATION_ERROR', 'Invalid update fields', [
        { field: 'body', issue: parseResult.error.errors.map((e) => e.message).join(', ') }
      ])
    );
    return;
  }

  try {
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };
    const problem = await ProblemModel.findOne(query);

    if (!problem) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Practice problem not found'));
      return;
    }

    const userId = req.user?.id;
    const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'INSTRUCTOR';
    if (!isStaff && problem.createdBy !== userId) {
      res.status(403).json(createErrorResponse('FORBIDDEN', 'You do not have permission to edit this practice problem'));
      return;
    }

    const updateData = parseResult.data;
    if (updateData.testCases) {
      updateData.testCases = updateData.testCases.map((tc, idx) => ({
        ...tc,
        id: tc.id && tc.id.trim() ? tc.id : `tc-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
        weight: tc.weight || 1.0,
        isPublic: tc.isPublic !== undefined ? tc.isPublic : idx < 2
      }));
    }

    Object.assign(problem, updateData);
    await problem.save();

    res.status(200).json(createSuccessResponse(problem, 'Practice problem updated successfully'));
  } catch (err: any) {
    console.error('[PracticeProblemController] updatePracticeProblem error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to update practice problem'));
  }
}

export async function deletePracticeProblem(req: Request, res: Response): Promise<void> {
  if (!checkMongoReady(res)) return;

  const idParam = req.params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!id) {
    res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Problem ID is required'));
    return;
  }

  try {
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };
    const problem = await ProblemModel.findOne(query);

    if (!problem) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Practice problem not found'));
      return;
    }

    const userId = req.user?.id;
    const isStaff = req.user?.role === 'ADMIN' || req.user?.role === 'INSTRUCTOR';
    if (!isStaff && problem.createdBy !== userId) {
      res.status(403).json(createErrorResponse('FORBIDDEN', 'You do not have permission to delete this practice problem'));
      return;
    }

    await ProblemModel.deleteOne({ _id: problem._id });
    res.status(200).json(createSuccessResponse({ id: problem._id.toString() }, 'Practice problem deleted successfully'));
  } catch (err: any) {
    console.error('[PracticeProblemController] deletePracticeProblem error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to delete practice problem'));
  }
}

export async function forkCatalogProblem(req: Request, res: Response): Promise<void> {
  if (!checkMongoReady(res)) return;

  const idParam = req.params.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  if (!id) {
    res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Source problem ID is required'));
    return;
  }

  const parseResult = PracticeProblemForkSchema.safeParse(req.body);
  const customTitle = parseResult.success ? parseResult.data.customTitle : undefined;

  try {
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };
    const sourceQuery: any = ProblemModel.findOne(query);
    const sourceProblem = typeof sourceQuery?.lean === 'function' ? await sourceQuery.lean() : await sourceQuery;

    if (!sourceProblem) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Source problem not found'));
      return;
    }

    const userId = req.user?.id || 'anonymous_student';
    const username = req.user?.username || 'Student';
    const title = customTitle || `[Fork] ${sourceProblem.title}`;
    const slug = generateSafeSlug(title, userId);

    const forkedTestCases = (sourceProblem.testCases || []).map((tc: any, idx: number) => ({
      ...tc,
      id: `fork-tc-${Date.now()}-${idx + 1}`
    }));

    const forkedProblem = await ProblemModel.create({
      title,
      slug,
      status: 'PRACTICE',
      isCustomPractice: true,
      practiceVisibility: 'PRIVATE',
      forkedFromProblemId: sourceProblem._id.toString(),
      version: 1,
      difficulty: sourceProblem.difficulty,
      tags: [...(sourceProblem.tags || []), 'Forked'],
      description: sourceProblem.description,
      constraints: sourceProblem.constraints || [],
      examples: sourceProblem.examples || [],
      timeLimitMs: sourceProblem.timeLimitMs || 2000,
      memoryLimitKb: sourceProblem.memoryLimitKb || 262144,
      benchmarks: sourceProblem.benchmarks,
      starterCode: sourceProblem.starterCode || {},
      testCases: forkedTestCases,
      createdBy: userId,
      authorMetadata: {
        username,
        role: (req.user?.role || 'STUDENT') as any,
        isAIAssisted: false
      }
    });

    res.status(201).json(createSuccessResponse(forkedProblem, 'Problem forked successfully to your personal practice lab!'));
  } catch (err: any) {
    console.error('[PracticeProblemController] forkCatalogProblem error:', err.message);
    res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'Failed to fork problem'));
  }
}

export async function generateAIPracticeProblem(req: Request, res: Response): Promise<void> {
  if (!checkMongoReady(res)) return;

  const prompt = req.body.prompt || req.body.topic;
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
    res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Prompt or topic must be at least 5 characters long'));
    return;
  }

  try {
    const userId = req.user?.id || 'anonymous_student';
    const username = req.user?.username || 'Student';
    const role = req.user?.role || 'STUDENT';

    console.log(`[PracticeProblemController] Generating AI practice problem for prompt: "${prompt.slice(0, 50)}..."`);
    const generated = await practiceGeminiClient.generateProblemMaterials(prompt.trim());

    const slug = generateSafeSlug(generated.title, userId);
    const processedTestCases = generated.testCases.map((tc, idx) => ({
      ...tc,
      id: tc.id || `tc-ai-${Date.now()}-${idx + 1}`,
      weight: 1.0,
      isPublic: idx < 2
    }));

    const practiceProblem = await ProblemModel.create({
      title: generated.title,
      slug,
      status: 'PRACTICE',
      isCustomPractice: true,
      practiceVisibility: 'PRIVATE',
      version: 1,
      difficulty: generated.difficulty,
      tags: [...(generated.tags || []), 'AI-Practice'],
      description: generated.description,
      constraints: generated.constraints || [],
      examples: generated.examples || [],
      timeLimitMs: 2000,
      memoryLimitKb: 262144,
      starterCode: generated.starterCode || {},
      testCases: processedTestCases,
      createdBy: userId,
      authorMetadata: {
        username,
        role: role as any,
        isAIAssisted: true
      }
    });

    res.status(201).json(
      createSuccessResponse(practiceProblem, 'AI Practice Problem generated and ready to solve in sandbox!')
    );
  } catch (err: any) {
    console.error('[PracticeProblemController] generateAIPracticeProblem error:', err.message);
    res.status(500).json(
      createErrorResponse('AI_GENERATION_FAILED', `Failed to generate AI problem: ${err.message}`)
    );
  }
}
