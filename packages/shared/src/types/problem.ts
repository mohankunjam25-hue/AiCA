import { SupportedLanguage } from '../constants/languages.js';
import { SolutionApproach, ApproachComparisonRow } from './evaluation.js';

export type ProblemDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type ProblemLifecycleStatus = 'UNPUBLISHED' | 'PUBLISHED' | 'DEPRECATED' | 'ARCHIVED';
export type ProblemSortOption = 'latest' | 'difficulty_asc' | 'difficulty_desc' | 'title_asc';

export type ProposalStatus =
  | 'DRAFT'
  | 'QUEUED_FOR_GENERATION'
  | 'AI_ANALYZING'
  | 'AWAITING_CLARIFICATION'
  | 'GENERATED'
  | 'QUEUED_FOR_VALIDATION'
  | 'VALIDATING'
  | 'VALIDATION_FAILED'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'REJECTED'
  | 'DISCARDED';

export type DataType =
  | 'int'
  | 'float'
  | 'string'
  | 'boolean'
  | 'list<int>'
  | 'list<float>'
  | 'list<string>'
  | 'list<boolean>'
  | 'matrix<int>'
  | 'matrix<string>'
  | 'matrix<char>'
  | 'ListNode'
  | 'list<ListNode>'
  | 'TreeNode'
  | 'void';

export interface FunctionParameter {
  name: string;
  type: DataType | string;
}

export interface FunctionSignature {
  functionName: string;
  className?: string; // default: "Solution"
  returnType: DataType | string;
  parameters: FunctionParameter[];
  isInPlaceMutation?: boolean; // If true (e.g. reverseString/sortColors), print mutated param[0]
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isPublic: boolean;
  isEdgeCase: boolean;
  explanation?: string;
  weight: number;
}

export interface ProblemExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ProblemBenchmarks {
  targetTimeMs: number;
  pythonMultiplier: number;
  jsMultiplier: number;
  cppMultiplier: number;
  javaMultiplier: number;
}

export interface Problem {
  id: string; // MongoDB ObjectId
  title: string;
  slug: string;
  status: ProblemLifecycleStatus;
  version: number;
  sourceProposalId?: string;
  difficulty: ProblemDifficulty;
  tags: string[];
  description: string;
  constraints: string[];
  examples: ProblemExample[];
  timeLimitMs: number;
  memoryLimitKb: number;
  benchmarks: ProblemBenchmarks;
  functionSignature?: FunctionSignature;
  starterCode: Record<SupportedLanguage, string>;
  testCases?: TestCase[]; // Populated only for admin or internally by worker
  solutionApproaches?: SolutionApproach[];
  comparisonMatrix?: ApproachComparisonRow[];
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate?: number;
  createdBy: string; // PostgreSQL UUID
  createdAt: string;
  updatedAt: string;
}

export interface ProblemListItem {
  id: string;
  title: string;
  slug: string;
  difficulty: ProblemDifficulty;
  tags: string[];
  acceptanceRate: number;
  totalSubmissions: number;
  userStatus?: 'SOLVED' | 'ATTEMPTED' | 'TODO';
}

export interface ProblemProposalClarification {
  id: string;
  question: string;
  options?: string[];
  userAnswer?: string;
}

export interface ProblemProposalValidationReport {
  differentialConcordancePercent: number;
  totalCasesEvaluated: number;
  canonicalStats: { minRuntimeMs: number; medianRuntimeMs: number; memoryKb: number };
  secondaryStats: { minRuntimeMs: number; medianRuntimeMs: number; memoryKb: number };
  invariantsPassed: boolean;
  contradictionsDetected: boolean;
  failureReason?: string;
  validatedAt: string;
}

export interface ProblemProposalGeneratedContent {
  title: string;
  slug: string;
  difficulty: ProblemDifficulty;
  tags: string[];
  description: string;
  constraints: string[];
  examples: ProblemExample[];
  functionSignature?: FunctionSignature;
  starterCode: Record<SupportedLanguage, string>;
  referenceSolutions: {
    canonicalPython: string;
    secondaryOracle: string;
  };
  testCases: TestCase[];
}

export interface ProblemProposal {
  id: string;
  creatorUserId: string;
  creatorUsername: string;
  originalPrompt: string;
  status: ProposalStatus;
  version: number;
  idempotencyKey: string;
  clarifications: ProblemProposalClarification[];
  generatedContent?: ProblemProposalGeneratedContent;
  validationReport?: ProblemProposalValidationReport;
  adminReview?: {
    reviewedBy?: string;
    reviewedAt?: string;
    decisionNotes?: string;
  };
  publishedProblemId?: string;
  createdAt: string;
  updatedAt: string;
}
