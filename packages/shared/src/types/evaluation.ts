import { PipelineStatus, Verdict } from './submission.js';

export type AIAnalysisStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
export type AIAnalysisMode = 'OPTIMIZATION' | 'DIAGNOSTIC';

export interface TheoreticalComplexity {
  timeComplexity: string;
  spaceComplexity: string;
  explanation: string;
}

export interface CodeQualityMetrics {
  score: number; // 1 - 10
  qualityGrade?: 'A+' | 'A' | 'B' | 'C' | 'NEEDS_REFACTOR';
  overallScore?: number; // 1 - 100
  readabilityAnalysis: string;
  codeSmells: string[];
  positivePractices: string[];
}

export interface OptimizationSuggestion {
  title: string;
  rationale: string;
  expectedTimeImpact: string;
  refactoredSnippet: string;
}

export interface CodeImprovement {
  category: 'PERFORMANCE' | 'CLEAN_CODE' | 'MEMORY' | 'SAFETY';
  suggestion: string;
  codeSnippetBefore?: string;
  codeSnippetAfter?: string;
}

export interface SolutionApproach {
  approachNumber: number;
  title: string;
  paradigm: 'BRUTE_FORCE' | 'TWO_POINTER' | 'HASHING' | 'DYNAMIC_PROGRAMMING' | 'BINARY_SEARCH' | 'GREEDY' | 'BITWISE' | 'OPTIMAL' | 'OTHER' | string;
  isUserApproach: boolean;
  timeComplexity: string;
  spaceComplexity: string;
  intuition: string;
  pros: string[];
  cons: string[];
  pseudoCodeOrGuide?: string;
  executableCode?: string;
}

export interface ApproachComparisonRow {
  approach: string;
  time: string;
  space: string;
  suitability: string;
}

export interface DiagnosticFeedback {
  rootCauseBug: string;
  edgeCaseVulnerability: string;
  socraticHint: string;
}

export interface AIAnalysisReport {
  status: AIAnalysisStatus;
  mode: AIAnalysisMode;
  codeSummary: string;
  theoreticalComplexity: TheoreticalComplexity;
  codeQuality: CodeQualityMetrics;
  diagnosticFeedback?: DiagnosticFeedback;
  optimizationSuggestions: OptimizationSuggestion[];
  improvements?: CodeImprovement[];
  solutionApproaches?: SolutionApproach[];
  comparisonMatrix?: ApproachComparisonRow[];
  generatedAt?: string;
}

export interface EvaluationReportMetrics {
  rawTimeMs: number;
  normalizedTimeMs: number;
  rawMemoryKb: number;
  normalizedMemoryKb: number;
  compositeScore: number;
  percentileTime: number;
  percentileMemory: number;
}

export interface DeterministicAnalytics {
  runtimePercentile: number;   // e.g. 92.4 (beats 92.4% of accepted submissions)
  memoryPercentile: number;    // e.g. 84.1 (beats 84.1% of accepted submissions)
  cyclomaticComplexity: number;
  maxLoopDepth: number;
  qualityScore: number;        // 1 - 100
  qualityGrade: 'A+' | 'A' | 'B' | 'C' | 'NEEDS_REFACTOR';
  codeSmells: string[];
  positivePatterns: string[];
  matchedApproachTitle?: string;
  matchedApproachNumber?: number;
}

export interface EvaluationReport {
  id: string; // MongoDB ObjectId
  submissionId: string;
  userId: string;
  username: string;
  problemId: string;
  verdict: Verdict;
  pipelineStatus: PipelineStatus;
  summary: string;
  aiAnalysis: AIAnalysisReport;
  deterministicAnalytics?: DeterministicAnalytics;
  metrics: EvaluationReportMetrics;
  createdAt: string;
}
