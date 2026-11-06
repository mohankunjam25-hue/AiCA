import { z } from 'zod';
import {
  AIAnalysisReport,
  TheoreticalComplexity,
  CodeQualityMetrics,
  OptimizationSuggestion,
  DiagnosticFeedback
} from '@aica/shared';

export const AlgorithmGenerationSchema = z.object({
  isAlgorithm: z.boolean(),
  name: z.string().min(2),
  category: z.string().min(2),
  description: z.string().min(10),
  timeComplexity: z.string().min(1),
  spaceComplexity: z.string().min(1),
  code: z.object({
    javascript: z.string().min(1),
    python: z.string().min(1)
  }),
  steps: z.array(z.string().min(1)).min(2).max(10)
});

export const CodeImprovementSchema = z.object({
  category: z.enum(['PERFORMANCE', 'CLEAN_CODE', 'MEMORY', 'SAFETY']).default('CLEAN_CODE'),
  suggestion: z.string(),
  codeSnippetBefore: z.string().optional(),
  codeSnippetAfter: z.string().optional()
});

export const SolutionApproachSchema = z.object({
  approachNumber: z.number(),
  title: z.string(),
  paradigm: z.string().default('OPTIMAL'),
  isUserApproach: z.boolean().default(false),
  timeComplexity: z.string(),
  spaceComplexity: z.string(),
  intuition: z.string(),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  pseudoCodeOrGuide: z.string().optional()
});

export const ApproachComparisonRowSchema = z.object({
  approach: z.string(),
  time: z.string(),
  space: z.string(),
  suitability: z.string()
});

export const OptimizationResponseSchema = z.object({
  codeSummary: z.string(),
  timeComplexity: z.string(),
  timeComplexityExplanation: z.string(),
  spaceComplexity: z.string(),
  spaceComplexityExplanation: z.string(),
  readabilityScore: z.number().min(1).max(10),
  overallScore: z.number().min(1).max(100).optional(),
  qualityGrade: z.enum(['A+', 'A', 'B', 'C', 'NEEDS_REFACTOR']).optional(),
  codeSmells: z.array(z.string()).default([]),
  positivePractices: z.array(z.string()).default([]),
  optimizationSuggestions: z
    .array(
      z.object({
        title: z.string(),
        rationale: z.string(),
        expectedTimeImpact: z.string(),
        refactoredSnippet: z.string()
      })
    )
    .default([]),
  improvements: z.array(CodeImprovementSchema).default([]),
  solutionApproaches: z.array(SolutionApproachSchema).default([]),
  comparisonMatrix: z.array(ApproachComparisonRowSchema).default([])
});

export const DiagnosticResponseSchema = z.object({
  codeSummary: z.string(),
  attemptedComplexity: z.object({
    timeComplexity: z.string(),
    spaceComplexity: z.string(),
    explanation: z.string()
  }),
  diagnosticFeedback: z.object({
    rootCauseBug: z.string(),
    edgeCaseVulnerability: z.string(),
    socraticHint: z.string()
  }),
  readabilityScore: z.number().min(1).max(10).default(5),
  codeSmells: z.array(z.string()).default([])
});

export const ComparisonResponseSchema = z.object({
  timeComplexityComparison: z.string(),
  spaceComplexityComparison: z.string(),
  tradeOffSummary: z.string(),
  architecturalEvolution: z.string().default('')
});

export const MultiComparisonResponseSchema = z.object({
  solutions: z.array(
    z.object({
      submissionId: z.string(),
      algorithmName: z.string(),
      versionLabel: z.string().optional(),
      timeComplexity: z.string(),
      spaceComplexity: z.string(),
      keyStrengths: z.array(z.string()).default([]),
      weaknessesOrBottlenecks: z.array(z.string()).default([]),
      optimizationNotes: z.string().default('')
    })
  ),
  rankings: z
    .array(
      z.object({
        algorithmName: z.string(),
        timeComplexity: z.string(),
        spaceComplexity: z.string(),
        rank: z.number(),
        rationale: z.string()
      })
    )
    .default([]),
  evolutionarySynthesis: z.string(),
  pedagogicalTakeaway: z.string()
});

export const ClarificationResponseSchema = z.object({
  isClearAndComplete: z.boolean(),
  missingInformationSummary: z.string().optional(),
  clarifications: z.array(
    z.object({
      id: z.string(),
      question: z.string(),
      options: z.array(z.string()).optional()
    })
  ).default([])
});

export const ProblemGenerationResponseSchema = z.object({
  title: z.string(),
  slug: z.string(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  tags: z.array(z.string()),
  description: z.string(),
  constraints: z.array(z.string()),
  examples: z.array(
    z.object({
      input: z.string(),
      output: z.string(),
      explanation: z.string().optional()
    })
  ),
  starterCode: z.object({
    python: z.string(),
    javascript: z.string(),
    cpp: z.string(),
    java: z.string()
  }),
  referenceSolutions: z.object({
    canonicalPython: z.string(),
    secondaryOracle: z.string()
  }),
  testCases: z.array(
    z.object({
      id: z.string(),
      input: z.string(),
      expectedOutput: z.string(),
      isPublic: z.boolean().default(false),
      isEdgeCase: z.boolean().default(false),
      explanation: z.string().optional()
    })
  )
});
