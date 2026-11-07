import { z } from 'zod';

export const FunctionParameterSchema = z.object({
  name: z.string(),
  type: z.string()
});

export const FunctionSignatureSchema = z.object({
  functionName: z.string(),
  className: z.string().optional().default('Solution'),
  returnType: z.string(),
  parameters: z.array(FunctionParameterSchema),
  isInPlaceMutation: z.boolean().optional().default(false)
});

export const TestCaseSchema = z.object({
  id: z.string().optional(),
  input: z.string(),
  expectedOutput: z.string(),
  isPublic: z.boolean().default(false),
  isEdgeCase: z.boolean().default(false),
  explanation: z.string().optional(),
  weight: z.number().default(1.0)
});

export const ProblemCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').max(100, 'Slug cannot exceed 100 characters').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must consist of lowercase alphanumeric characters separated by hyphens'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  status: z.enum(['UNPUBLISHED', 'PUBLISHED', 'DEPRECATED', 'ARCHIVED']).default('UNPUBLISHED'),
  tags: z.array(z.string().min(1)).min(1, 'At least one tag is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  constraints: z.array(z.string()).default([]),
  examples: z.array(
    z.object({
      input: z.string(),
      output: z.string(),
      explanation: z.string().optional()
    })
  ).default([]),
  timeLimitMs: z.number().int().min(100).max(10000).default(2000),
  memoryLimitKb: z.number().int().min(16384).max(524288).default(262144),
  functionSignature: FunctionSignatureSchema.optional(),
  starterCode: z.object({
    python: z.string().optional().default(''),
    javascript: z.string().optional().default(''),
    cpp: z.string().optional().default(''),
    java: z.string().optional().default('')
  }).optional().default({}),
  testCases: z.array(TestCaseSchema).default([])
});

export type ProblemCreateDto = z.infer<typeof ProblemCreateSchema>;

export const ProblemUpdateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters').optional(),
  slug: z.string().min(3, 'Slug must be at least 3 characters').max(100, 'Slug cannot exceed 100 characters').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must consist of lowercase alphanumeric characters separated by hyphens').optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  status: z.enum(['UNPUBLISHED', 'PUBLISHED', 'DEPRECATED', 'ARCHIVED']).optional(),
  tags: z.array(z.string().min(1)).min(1, 'At least one tag is required').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').optional(),
  constraints: z.array(z.string()).optional(),
  examples: z.array(
    z.object({
      input: z.string(),
      output: z.string(),
      explanation: z.string().optional()
    })
  ).optional(),
  timeLimitMs: z.number().int().min(100).max(10000).optional(),
  memoryLimitKb: z.number().int().min(16384).max(524288).optional(),
  functionSignature: FunctionSignatureSchema.optional(),
  starterCode: z.object({
    python: z.string().optional(),
    javascript: z.string().optional(),
    cpp: z.string().optional(),
    java: z.string().optional()
  }).optional(),
  testCases: z.array(TestCaseSchema).optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export type ProblemUpdateDto = z.infer<typeof ProblemUpdateSchema>;

export const ProblemQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  tag: z.string().optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['latest', 'difficulty_asc', 'difficulty_desc', 'title_asc']).default('latest')
});

export type ProblemQueryDto = z.infer<typeof ProblemQuerySchema>;

export const ProblemProposalCreateSchema = z.object({
  prompt: z.string().min(10, 'Problem description must be at least 10 characters long').max(2000, 'Problem description cannot exceed 2000 characters')
});

export type ProblemProposalCreateDto = z.infer<typeof ProblemProposalCreateSchema>;

export const ProblemProposalClarifySchema = z.object({
  answers: z.record(z.string())
});

export type ProblemProposalClarifyDto = z.infer<typeof ProblemProposalClarifySchema>;

export const AdminProposalApproveSchema = z.object({
  decisionNotes: z.string().max(500).optional()
});

export type AdminProposalApproveDto = z.infer<typeof AdminProposalApproveSchema>;

export const AdminProposalRejectSchema = z.object({
  reason: z.string().min(5, 'Rejection reason must be at least 5 characters').max(500)
});

export type AdminProposalRejectDto = z.infer<typeof AdminProposalRejectSchema>;
