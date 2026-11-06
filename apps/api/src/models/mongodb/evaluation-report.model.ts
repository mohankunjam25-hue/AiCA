import mongoose, { Schema, Document } from 'mongoose';
import { EvaluationReport } from '@aica/shared';

export interface EvaluationReportDocument extends Omit<EvaluationReport, 'id'>, Document {}

const EvaluationReportSchema = new Schema<EvaluationReportDocument>({
  submissionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  username: { type: String, required: true },
  problemId: { type: String, required: true, index: true },
  verdict: { type: String, required: true },
  pipelineStatus: { type: String, required: true },
  summary: { type: String, required: true },
  deterministicAnalytics: {
    runtimePercentile: { type: Number, default: 90 },
    memoryPercentile: { type: Number, default: 85 },
    cyclomaticComplexity: { type: Number, default: 1 },
    maxLoopDepth: { type: Number, default: 1 },
    qualityScore: { type: Number, default: 85 },
    qualityGrade: { type: String, enum: ['A+', 'A', 'B', 'C', 'NEEDS_REFACTOR'], default: 'A' },
    codeSmells: [{ type: String }],
    positivePatterns: [{ type: String }],
    matchedApproachTitle: { type: String },
    matchedApproachNumber: { type: Number }
  },
  aiAnalysis: {
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED', 'SKIPPED'],
      default: 'PENDING'
    },
    mode: {
      type: String,
      enum: ['OPTIMIZATION', 'DIAGNOSTIC'],
      default: 'OPTIMIZATION'
    },
    codeSummary: { type: String, default: '' },
    theoreticalComplexity: {
      timeComplexity: { type: String, default: '' },
      spaceComplexity: { type: String, default: '' },
      explanation: { type: String, default: '' }
    },
    codeQuality: {
      score: { type: Number, default: 5 },
      qualityGrade: { type: String, enum: ['A+', 'A', 'B', 'C', 'NEEDS_REFACTOR'] },
      overallScore: { type: Number },
      readabilityAnalysis: { type: String, default: '' },
      codeSmells: [{ type: String }],
      positivePractices: [{ type: String }]
    },
    diagnosticFeedback: {
      rootCauseBug: { type: String },
      edgeCaseVulnerability: { type: String },
      socraticHint: { type: String }
    },
    optimizationSuggestions: [{
      title: { type: String },
      rationale: { type: String },
      expectedTimeImpact: { type: String },
      refactoredSnippet: { type: String }
    }],
    improvements: [{
      category: { type: String, enum: ['PERFORMANCE', 'CLEAN_CODE', 'MEMORY', 'SAFETY'] },
      suggestion: { type: String },
      codeSnippetBefore: { type: String },
      codeSnippetAfter: { type: String }
    }],
    solutionApproaches: [{
      approachNumber: { type: Number },
      title: { type: String },
      paradigm: { type: String },
      isUserApproach: { type: Boolean, default: false },
      timeComplexity: { type: String },
      spaceComplexity: { type: String },
      intuition: { type: String },
      pros: [{ type: String }],
      cons: [{ type: String }],
      pseudoCodeOrGuide: { type: String }
    }],
    comparisonMatrix: [{
      approach: { type: String },
      time: { type: String },
      space: { type: String },
      suitability: { type: String }
    }],
    generatedAt: { type: String }
  },
  metrics: {
    rawTimeMs: { type: Number, default: 0 },
    normalizedTimeMs: { type: Number, default: 0 },
    rawMemoryKb: { type: Number, default: 0 },
    normalizedMemoryKb: { type: Number, default: 0 },
    compositeScore: { type: Number, default: 0 },
    percentileTime: { type: Number, default: 0 },
    percentileMemory: { type: Number, default: 0 }
  }
}, {
  collection: 'evaluation_reports',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret: Record<string, any>) => {
      ret.id = ret._id ? ret._id.toString() : '';
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

export const EvaluationReportModel = mongoose.model<EvaluationReportDocument>(
  'EvaluationReport',
  EvaluationReportSchema
);
