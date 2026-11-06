import mongoose, { Schema, Document } from 'mongoose';
import { Problem, TestCase, ProblemDifficulty } from '@aica/shared';

export interface ProblemDocument extends Omit<Problem, 'id'>, Document {}

const TestCaseSchema = new Schema<TestCase>({
  id: { type: String, required: true },
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isPublic: { type: Boolean, default: false },
  isEdgeCase: { type: Boolean, default: false },
  explanation: { type: String, default: '' },
  weight: { type: Number, default: 1.0 }
}, { _id: false });

const ProblemSchema = new Schema<ProblemDocument>({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  status: {
    type: String,
    enum: ['UNPUBLISHED', 'PUBLISHED', 'DEPRECATED', 'ARCHIVED'],
    default: 'UNPUBLISHED', // Safe default: new problems are never exposed publicly before approval
    required: true,
    index: true
  },
  version: { type: Number, default: 1, required: true },
  sourceProposalId: { type: String, unique: true, sparse: true, index: true },
  difficulty: {
    type: String,
    enum: ['EASY', 'MEDIUM', 'HARD'],
    required: true,
    index: true
  },
  tags: [{ type: String, index: true }],
  description: { type: String, required: true },
  constraints: [{ type: String }],
  examples: [{
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String }
  }],
  timeLimitMs: { type: Number, default: 2000 },
  memoryLimitKb: { type: Number, default: 262144 },
  benchmarks: {
    targetTimeMs: { type: Number, default: 15 },
    pythonMultiplier: { type: Number, default: 4.0 },
    jsMultiplier: { type: Number, default: 2.5 },
    cppMultiplier: { type: Number, default: 1.0 },
    javaMultiplier: { type: Number, default: 2.0 }
  },
  starterCode: {
    python: { type: String, default: '' },
    javascript: { type: String, default: '' },
    cpp: { type: String, default: '' },
    java: { type: String, default: '' }
  },
  testCases: [TestCaseSchema],
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
  totalSubmissions: { type: Number, default: 0 },
  acceptedSubmissions: { type: Number, default: 0 },
  createdBy: { type: String, required: true } // PostgreSQL UUID
}, {
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

// Compound indexes
ProblemSchema.index({ difficulty: 1, tags: 1 });
ProblemSchema.index({ status: 1, difficulty: 1, createdAt: -1 });

export const ProblemModel = mongoose.model<ProblemDocument>('Problem', ProblemSchema);
