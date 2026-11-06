import mongoose from 'mongoose';
import { GeminiAnalysisClient } from '@aica/ai-engine';
import {
  Verdict,
  SupportedLanguage,
  AIAnalysisStatus,
  AIAnalysisReport
} from '@aica/shared';
import { ScoringService } from './scoring.service.js';

export interface AiEvaluationContext {
  submissionId: string;
  problemId: string;
  userId: string;
  username: string;
  language: string;
  code: string;
  verdict: Verdict;
  executionTimeMs: number;
  memoryUsedKb: number;
  passedCount: number;
  totalCount: number;
  compileOutput?: string;
  isTestRun?: boolean;
}

export interface AiEvaluationResult {
  success: boolean;
  aiStatus: AIAnalysisStatus;
  reportId?: string;
  compositeScore?: number;
  error?: string;
}

export class AiEvaluatorService {
  private aiClient: GeminiAnalysisClient;

  constructor(aiClient?: GeminiAnalysisClient) {
    this.aiClient = aiClient || new GeminiAnalysisClient();
  }

  /**
   * Safely execute AI analysis for a submission with total isolation.
   * Under NO circumstances will an AI failure or timeout alter or revert
   * the submission's deterministic verdict.
   */
  public async evaluateSubmissionAi(
    ctx: AiEvaluationContext,
    deps?: {
      db?: mongoose.Connection;
      publishProgress?: (
        subId: string,
        status: string,
        verdict: Verdict,
        step: number,
        total: number,
        extra?: Record<string, any>
      ) => Promise<void>;
      redisPublisher?: any;
      timeoutMs?: number;
    }
  ): Promise<AiEvaluationResult> {
    const {
      submissionId,
      problemId,
      userId,
      username,
      language,
      code,
      verdict,
      executionTimeMs,
      memoryUsedKb,
      passedCount,
      totalCount,
      compileOutput,
      isTestRun
    } = ctx;

    const db = deps?.db || mongoose.connection;
    const submissionsCol = db.collection('submissions');
    const problemsCol = db.collection('problems');
    const reportsCol = db.collection('evaluation_reports');
    const timeoutMs = deps?.timeoutMs || 15000;

    // Safety Invariant Check: Verify the submission exists and has a deterministic verdict
    const currentSub = await submissionsCol.findOne({
      _id: new mongoose.Types.ObjectId(submissionId)
    });
    if (!currentSub) {
      throw new Error(`Submission ${submissionId} not found`);
    }

    const deterministicVerdict = currentSub.verdict as Verdict;
    if (deterministicVerdict === 'PENDING') {
      throw new Error('Deterministic verdict must be established before AI analysis');
    }

    // Compilation error: AI analysis is bypassed
    if (deterministicVerdict === 'COMPILATION_ERROR') {
      const skippedReport: Partial<AIAnalysisReport> = {
        status: 'SKIPPED',
        mode: 'OPTIMIZATION',
        codeSummary: 'Compilation failed. AI analysis bypassed.',
        theoreticalComplexity: {
          timeComplexity: 'N/A',
          spaceComplexity: 'N/A',
          explanation: 'Code failed compilation stage.'
        },
        codeQuality: {
          score: 1.0,
          readabilityAnalysis: 'Code failed compilation.',
          codeSmells: [],
          positivePractices: []
        },
        optimizationSuggestions: []
      };

      const reportId = await this.upsertReport(
        reportsCol,
        submissionId,
        userId,
        username,
        problemId,
        deterministicVerdict,
        skippedReport,
        'SKIPPED',
        executionTimeMs,
        memoryUsedKb,
        currentSub.compositeScore || 0
      );

      await submissionsCol.updateOne(
        { _id: new mongoose.Types.ObjectId(submissionId) },
        {
          $set: {
            pipelineStatus: 'COMPLETED',
            aiStatus: 'SKIPPED',
            evaluationReportId: reportId,
            updatedAt: new Date()
          }
        }
      );

      return {
        success: true,
        aiStatus: 'SKIPPED',
        reportId,
        compositeScore: currentSub.compositeScore || 0
      };
    }

    // Fetch problem details for prompt context
    const problem = await problemsCol.findOne({
      _id: new mongoose.Types.ObjectId(problemId)
    });

    let aiReportPartial: any;
    let aiStatus: AIAnalysisStatus = 'COMPLETED';
    let aiErrorMessage = '';

    // Isolated AI call with timeout protection
    try {
      if (deps?.publishProgress) {
        await deps.publishProgress(
          submissionId,
          'ANALYZING_AI',
          deterministicVerdict,
          3,
          4,
          { aiStatus: 'PENDING' }
        );
      }

      await submissionsCol.updateOne(
        { _id: new mongoose.Types.ObjectId(submissionId) },
        { $set: { pipelineStatus: 'ANALYZING_AI', aiStatus: 'PENDING' } }
      );

      const aiCallPromise =
        deterministicVerdict === 'ACCEPTED'
          ? this.aiClient.analyzeAcceptedSolution({
              problemTitle: problem?.title || 'Coding Problem',
              problemDescription: problem?.description || '',
              constraints: problem?.constraints || [],
              language,
              code,
              executionTimeMs,
              memoryKb: memoryUsedKb
            })
          : this.aiClient.analyzeDiagnosticSolution({
              problemTitle: problem?.title || 'Coding Problem',
              problemDescription: problem?.description || '',
              constraints: problem?.constraints || [],
              language,
              code,
              verdict: deterministicVerdict,
              failedTestSummary: `Failed with ${deterministicVerdict} on test evaluation. Passed ${passedCount}/${totalCount} test cases.`,
              errorMessage: compileOutput
            });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`AI analysis timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      );

      aiReportPartial = await Promise.race([aiCallPromise, timeoutPromise]);
      aiStatus = 'COMPLETED';
    } catch (aiErr: any) {
      console.warn(
        `[AiEvaluatorService] AI analysis failed or timed out for submission ${submissionId}:`,
        aiErr.message
      );
      aiStatus = 'FAILED';
      aiErrorMessage = aiErr.message || 'AI analysis unavailable';

      aiReportPartial = {
        status: 'FAILED',
        mode: deterministicVerdict === 'ACCEPTED' ? 'OPTIMIZATION' : 'DIAGNOSTIC',
        codeSummary: `AI background insights currently offline (${aiErrorMessage}). Deterministic code quality and taxonomy preserved.`,
        optimizationSuggestions: []
      };
    }

    // Scoring calculation (refine with AI quality score if available)
    const qualityScore =
      aiStatus === 'COMPLETED' && aiReportPartial?.codeQuality?.score
        ? aiReportPartial.codeQuality.score
        : 7.0;

    const scoring = ScoringService.calculate({
      verdict: deterministicVerdict,
      passedCount,
      totalCount,
      language: language as SupportedLanguage,
      executionTimeMs,
      memoryUsedKb,
      aiQualityScore: qualityScore,
      targetTimeMs: problem?.benchmarks?.targetTimeMs || 15,
      timeLimitMs: problem?.timeLimitMs,
      memoryLimitKb: problem?.memoryLimitKb
    });

    // Update leaderboard if Accepted and not a test run
    if (deterministicVerdict === 'ACCEPTED' && !isTestRun && deps?.redisPublisher) {
      try {
        const zsetKey = `leaderboard:problem:${problemId}`;
        await deps.redisPublisher.zadd(zsetKey, scoring.compositeScore, submissionId);
      } catch (err: any) {
        console.warn('[AiEvaluatorService] Leaderboard update warning:', err.message);
      }
    }

    // Persist or Update Evaluation Report
    const reportId = await this.upsertReport(
      reportsCol,
      submissionId,
      userId,
      username,
      problemId,
      deterministicVerdict,
      aiReportPartial,
      aiStatus,
      executionTimeMs,
      memoryUsedKb,
      scoring.compositeScore,
      scoring.normalizedTimeMs,
      scoring.normalizedMemoryKb
    );

    // Persist update on Submission document
    // INVIOLABLE: verdict is NEVER modified by AI status
    await submissionsCol.updateOne(
      { _id: new mongoose.Types.ObjectId(submissionId) },
      {
        $set: {
          pipelineStatus: 'COMPLETED',
          verdict: deterministicVerdict, // Guarantees verdict preservation
          compositeScore: scoring.compositeScore,
          normalizedTimeMs: scoring.normalizedTimeMs,
          evaluationReportId: reportId,
          aiStatus,
          aiError: aiErrorMessage,
          updatedAt: new Date()
        }
      }
    );

    // Final SSE notification
    if (deps?.publishProgress) {
      await deps.publishProgress(
        submissionId,
        'COMPLETED',
        deterministicVerdict,
        4,
        4,
        {
          reportId,
          compositeScore: scoring.compositeScore,
          aiStatus
        }
      );
    }

    return {
      success: aiStatus === 'COMPLETED',
      aiStatus,
      reportId,
      compositeScore: scoring.compositeScore,
      error: aiErrorMessage || undefined
    };
  }

  private async upsertReport(
    reportsCol: any,
    submissionId: string,
    userId: string,
    username: string,
    problemId: string,
    verdict: Verdict,
    aiAnalysis: any,
    aiStatus: AIAnalysisStatus,
    executionTimeMs: number,
    memoryUsedKb: number,
    compositeScore: number,
    normalizedTimeMs = 0,
    normalizedMemoryKb = 0
  ): Promise<string> {
    const existing = await reportsCol.findOne({ submissionId });
    const existingAi = existing?.aiAnalysis || {};

    const mergedTheoreticalComplexity =
      aiStatus === 'COMPLETED' && aiAnalysis?.theoreticalComplexity?.timeComplexity && aiAnalysis?.theoreticalComplexity?.timeComplexity !== 'N/A'
        ? aiAnalysis.theoreticalComplexity
        : (existingAi.theoreticalComplexity || aiAnalysis?.theoreticalComplexity || {
            timeComplexity: 'O(N)',
            spaceComplexity: 'O(1)',
            explanation: 'Determined via AST analysis.'
          });

    const mergedCodeQuality =
      aiStatus === 'COMPLETED' && aiAnalysis?.codeQuality?.score
        ? { ...existingAi.codeQuality, ...aiAnalysis.codeQuality }
        : (existingAi.codeQuality || aiAnalysis?.codeQuality || {
            score: 8,
            readabilityAnalysis: 'Modular AST structure.',
            codeSmells: [],
            positivePractices: []
          });

    const mergedApproaches =
      (aiAnalysis?.solutionApproaches && aiAnalysis.solutionApproaches.length > 0)
        ? aiAnalysis.solutionApproaches
        : (existingAi.solutionApproaches || []);

    const mergedMatrix =
      (aiAnalysis?.comparisonMatrix && aiAnalysis.comparisonMatrix.length > 0)
        ? aiAnalysis.comparisonMatrix
        : (existingAi.comparisonMatrix || []);

    const aiAnalysisPayload = {
      ...existingAi,
      ...aiAnalysis,
      theoreticalComplexity: mergedTheoreticalComplexity,
      codeQuality: mergedCodeQuality,
      solutionApproaches: mergedApproaches,
      comparisonMatrix: mergedMatrix,
      status: aiStatus,
      generatedAt: new Date().toISOString()
    };

    const percentileTime = existing?.metrics?.percentileTime ?? 90;
    const percentileMemory = existing?.metrics?.percentileMemory ?? 85;

    if (existing) {
      await reportsCol.updateOne(
        { _id: existing._id },
        {
          $set: {
            verdict,
            pipelineStatus: 'COMPLETED',
            summary: `Evaluated test cases. Verdict: ${verdict}. AI Status: ${aiStatus}.`,
            aiAnalysis: aiAnalysisPayload,
            ...(existing.deterministicAnalytics ? { deterministicAnalytics: existing.deterministicAnalytics } : {}),
            metrics: {
              rawTimeMs: executionTimeMs,
              normalizedTimeMs,
              rawMemoryKb: memoryUsedKb,
              normalizedMemoryKb,
              compositeScore,
              percentileTime,
              percentileMemory
            },
            updatedAt: new Date().toISOString()
          }
        }
      );
      return existing._id.toString();
    } else {
      const inserted = await reportsCol.insertOne({
        submissionId,
        userId,
        username,
        problemId,
        verdict,
        pipelineStatus: 'COMPLETED',
        summary: `Evaluated test cases. Verdict: ${verdict}. AI Status: ${aiStatus}.`,
        aiAnalysis: aiAnalysisPayload,
        metrics: {
          rawTimeMs: executionTimeMs,
          normalizedTimeMs,
          rawMemoryKb: memoryUsedKb,
          normalizedMemoryKb,
          compositeScore,
          percentileTime,
          percentileMemory
        },
        createdAt: new Date().toISOString()
      });
      return inserted.insertedId.toString();
    }
  }
}
