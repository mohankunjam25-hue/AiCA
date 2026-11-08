import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import {
  PracticeProblemCreateSchema,
  PracticeProblemUpdateSchema,
  PracticeProblemForkSchema
} from '../packages/shared/dist/index.js';
import {
  createPracticeProblem,
  getMyPracticeProblems,
  updatePracticeProblem,
  deletePracticeProblem,
  forkCatalogProblem,
  generateAIPracticeProblem,
  practiceGeminiClient
} from '../apps/api/src/controllers/practice-problem.controller.js';
import { getProblems } from '../apps/api/src/controllers/problem.controller.js';
import { ProblemModel } from '../apps/api/src/models/mongodb/problem.model.js';
import { SubmissionModel } from '../apps/api/src/models/mongodb/submission.model.js';
import { createSubmission } from '../apps/api/src/controllers/submission.controller.js';

function mockReqRes(options: {
  query?: Record<string, any>;
  params?: Record<string, any>;
  body?: any;
  user?: any;
  headers?: Record<string, string>;
}) {
  const req: any = {
    query: options.query || {},
    params: options.params || {},
    body: options.body || {},
    user: options.user,
    headers: options.headers || {}
  };

  const res: any = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.data = payload;
      return this;
    },
    setHeader(name: string, val: string) {
      this.headers[name] = val;
      return this;
    }
  };

  return { req, res };
}

describe('Student Self-Authored Practice Problems & Personal Practice Lab Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(ProblemModel.base.connection, 'readyState', 'get').mockReturnValue(1);
    vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Schema Validation (PracticeProblemCreateSchema, Update, Fork)
  // =========================================================================
  describe('1. Shared Practice Schemas Validation', () => {
    it('PracticeProblemCreateSchema: accepts a valid student practice problem payload', () => {
      const validPayload = {
        title: 'Custom Inverted Binary Tree Practice',
        description: 'Implement tree inversion with strict memory bounds.',
        difficulty: 'MEDIUM',
        tags: ['Trees', 'Recursion'],
        codeTemplates: {
          typescript: 'function invertTree(root: TreeNode | null): TreeNode | null {}'
        },
        testCases: [
          {
            input: '[4,2,7,1,3,6,9]',
            expectedOutput: '[4,7,2,9,6,3,1]',
            isHidden: false
          }
        ],
        practiceVisibility: 'PRIVATE'
      };

      const result = PracticeProblemCreateSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Custom Inverted Binary Tree Practice');
        expect(result.data.practiceVisibility).toBe('PRIVATE');
      }
    });

    it('PracticeProblemCreateSchema: rejects invalid test case structure', () => {
      const invalidPayload = {
        title: 'Missing Test Cases Problem',
        description: 'Some description',
        difficulty: 'EASY',
        tags: ['Arrays'],
        codeTemplates: { python: 'def solve(): pass' },
        testCases: []
      };

      const result = PracticeProblemCreateSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('PracticeProblemForkSchema: parses optional custom title and hidden test toggle', () => {
      const forkPayload = {
        customTitle: 'My Forked Two Sum Challenge',
        includeHiddenTests: true
      };

      const result = PracticeProblemForkSchema.safeParse(forkPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.customTitle).toBe('My Forked Two Sum Challenge');
        expect(result.data.includeHiddenTests).toBe(true);
      }
    });
  });

  // =========================================================================
  // 2. Practice Problem Creation (createPracticeProblem)
  // =========================================================================
  describe('2. createPracticeProblem Controller', () => {
    it('successfully creates practice problem with status PRACTICE and isCustomPractice true', async () => {
      const studentUser = {
        id: 'student_123',
        username: 'coder_alex',
        role: 'STUDENT'
      };

      const mockSavedProblem = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Merge K Sorted Arrays',
        slug: 'merge-k-sorted-arrays-practice-1234',
        status: 'PRACTICE',
        isCustomPractice: true,
        practiceVisibility: 'PRIVATE',
        createdBy: studentUser.id,
        authorMetadata: {
          username: studentUser.username,
          role: studentUser.role,
          isAIAssisted: false
        },
        tags: ['Heaps', 'Divide-and-Conquer'],
        difficulty: 'HARD',
        description: 'Merge k sorted arrays into one.',
        testCases: [{ input: '[[1,4,5],[1,3,4],[2,6]]', expectedOutput: '[1,1,2,3,4,4,5,6]', isHidden: false }]
      };

      vi.spyOn(ProblemModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(ProblemModel, 'create').mockResolvedValue(mockSavedProblem as any);

      const { req, res } = mockReqRes({
        user: studentUser,
        body: {
          title: 'Merge K Sorted Arrays',
          description: 'Merge k sorted arrays into one.',
          difficulty: 'HARD',
          tags: ['Heaps', 'Divide-and-Conquer'],
          codeTemplates: { python: 'def mergeKArrays(arrays): pass' },
          testCases: [{ input: '[[1,4,5],[1,3,4],[2,6]]', expectedOutput: '[1,1,2,3,4,4,5,6]', isHidden: false }],
          practiceVisibility: 'PRIVATE'
        }
      });

      await createPracticeProblem(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.status).toBe('PRACTICE');
      expect(res.data.data.isCustomPractice).toBe(true);
      expect(res.data.data.createdBy).toBe('student_123');
    });
  });

  // =========================================================================
  // 3. Student Personal Practice Lab Retrieval (getMyPracticeProblems)
  // =========================================================================
  describe('3. getMyPracticeProblems Controller', () => {
    it('retrieves only problems created by the current student with solved status annotation', async () => {
      const studentId = 'student_456';
      const mockProblemId = new mongoose.Types.ObjectId();

      const mockProblems = [
        {
          _id: mockProblemId,
          title: 'QuickSort Partition Edge Cases',
          slug: 'quicksort-partition-edge-cases-456-abc',
          difficulty: 'MEDIUM',
          tags: ['Sorting', 'Two-Pointers'],
          status: 'PRACTICE',
          isCustomPractice: true,
          practiceVisibility: 'PRIVATE',
          authorMetadata: { username: 'student_456', role: 'STUDENT' },
          testCases: [{}, {}],
          totalSubmissions: 5,
          acceptedSubmissions: 3,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const mockSubmissions = [
        {
          problemId: mockProblemId.toString(),
          verdict: 'ACCEPTED',
          executionTimeMs: 14
        }
      ];

      let capturedFilter: any = null;
      vi.spyOn(ProblemModel, 'find').mockImplementation((filter: any) => {
        capturedFilter = filter;
        return {
          select: () => ({
            sort: () => ({
              skip: () => ({
                limit: () => ({
                  lean: () => Promise.resolve(mockProblems)
                })
              })
            })
          })
        } as any;
      });

      vi.spyOn(ProblemModel, 'countDocuments').mockResolvedValue(1 as any);

      vi.spyOn(SubmissionModel, 'find').mockImplementation(() => {
        return {
          sort: () => ({
            select: () => ({
              lean: () => Promise.resolve(mockSubmissions)
            })
          })
        } as any;
      });

      const { req, res } = mockReqRes({
        user: { id: studentId, username: 'teststudent' },
        query: { page: '1', limit: '10' }
      });

      await getMyPracticeProblems(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.data.success).toBe(true);
      expect(capturedFilter.createdBy).toBe(studentId);
      expect(capturedFilter.isCustomPractice).toBe(true);

      const items = res.data.data.problems;
      expect(items).toHaveLength(1);
      expect(items[0].userStatus).toBe('SOLVED');
      expect(items[0].bestRuntimeMs).toBe(14);
    });
  });

  // =========================================================================
  // 4. Update and Delete Practice Problems
  // =========================================================================
  describe('4. updatePracticeProblem & deletePracticeProblem', () => {
    it('allows the creator student to update their practice problem', async () => {
      const studentId = 'student_789';
      const mockProblem: any = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Original Title',
        createdBy: studentId,
        isCustomPractice: true,
        save: vi.fn().mockResolvedValue(true)
      };

      vi.spyOn(ProblemModel, 'findOne').mockResolvedValue(mockProblem);

      const { req, res } = mockReqRes({
        user: { id: studentId },
        params: { id: mockProblem._id.toString() },
        body: { title: 'Updated Practice Problem Title' }
      });

      await updatePracticeProblem(req, res);

      expect(res.statusCode).toBe(200);
      expect(mockProblem.title).toBe('Updated Practice Problem Title');
      expect(mockProblem.save).toHaveBeenCalled();
    });

    it('forbids a different student from updating someone elses practice problem', async () => {
      const ownerId = 'student_owner';
      const hackerId = 'student_intruder';

      const mockProblem: any = {
        _id: new mongoose.Types.ObjectId(),
        title: 'Protected Problem',
        createdBy: ownerId,
        isCustomPractice: true
      };

      vi.spyOn(ProblemModel, 'findOne').mockResolvedValue(mockProblem);

      const { req, res } = mockReqRes({
        user: { id: hackerId, role: 'STUDENT' },
        params: { id: mockProblem._id.toString() },
        body: { title: 'Hacked Title' }
      });

      await updatePracticeProblem(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.data.error.code).toBe('FORBIDDEN');
    });

    it('allows owner to delete their practice problem', async () => {
      const ownerId = 'student_owner';
      const mockProblemId = new mongoose.Types.ObjectId();
      const mockProblem: any = {
        _id: mockProblemId,
        title: 'To Be Deleted',
        createdBy: ownerId,
        isCustomPractice: true
      };

      vi.spyOn(ProblemModel, 'findOne').mockResolvedValue(mockProblem);
      vi.spyOn(ProblemModel, 'deleteOne').mockResolvedValue({ deletedCount: 1 } as any);

      const { req, res } = mockReqRes({
        user: { id: ownerId, role: 'STUDENT' },
        params: { id: mockProblemId.toString() }
      });

      await deletePracticeProblem(req, res);

      expect(res.statusCode).toBe(200);
      expect(ProblemModel.deleteOne).toHaveBeenCalledWith({ _id: mockProblemId });
    });
  });

  // =========================================================================
  // 5. Forking Catalog Problem to Personal Practice Lab (forkCatalogProblem)
  // =========================================================================
  describe('5. forkCatalogProblem Controller', () => {
    it('creates an isolated personal copy of a catalog problem with PRACTICE status', async () => {
      const studentUser = { id: 'student_999', username: 'alex99', role: 'STUDENT' };
      const sourceId = new mongoose.Types.ObjectId();

      const sourceCatalogProblem: any = {
        _id: sourceId,
        title: 'Valid Palindrome II',
        slug: 'valid-palindrome-ii',
        difficulty: 'EASY',
        tags: ['Strings', 'Two-Pointers'],
        description: 'Given a string s, return true if the s can be palindrome after deleting at most one character.',
        constraints: ['1 <= s.length <= 10^5'],
        codeTemplates: { typescript: 'function validPalindrome(s: string): boolean {}' },
        testCases: [
          { input: '"aba"', expectedOutput: 'true', isHidden: false },
          { input: '"abca"', expectedOutput: 'true', isHidden: true }
        ],
        examples: [{ input: 's = "aba"', output: 'true' }],
        benchmarks: { timeLimitMs: 1000, memoryLimitMb: 128 },
        status: 'PUBLISHED'
      };

      vi.spyOn(ProblemModel, 'findOne').mockResolvedValue(sourceCatalogProblem);
      vi.spyOn(ProblemModel, 'create').mockImplementation(async (doc: any) => {
        return {
          ...doc,
          _id: new mongoose.Types.ObjectId()
        };
      });

      const { req, res } = mockReqRes({
        user: studentUser,
        params: { id: sourceId.toString() },
        body: {
          customTitle: 'Valid Palindrome II (Adversarial Edge Cases)',
          includeHiddenTests: true
        }
      });

      await forkCatalogProblem(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.data.success).toBe(true);
      const created = res.data.data;
      expect(created.title).toBe('Valid Palindrome II (Adversarial Edge Cases)');
      expect(created.status).toBe('PRACTICE');
      expect(created.isCustomPractice).toBe(true);
      expect(created.practiceVisibility).toBe('PRIVATE');
      expect(created.forkedFromProblemId).toBe(sourceId.toString());
      expect(created.testCases).toHaveLength(2);
    });
  });

  // =========================================================================
  // 6. Public Catalog Isolation Check (getProblems)
  // =========================================================================
  describe('6. Public Catalog Isolation', () => {
    it('strictly excludes custom practice problems from public catalog results', async () => {
      let capturedFilter: any = null;

      vi.spyOn(ProblemModel, 'find').mockImplementation((filter: any) => {
        capturedFilter = filter;
        return {
          select: () => ({
            skip: () => ({
              limit: () => ({
                sort: () => ({
                  lean: () => Promise.resolve([])
                })
              })
            })
          })
        } as any;
      });

      vi.spyOn(ProblemModel, 'countDocuments').mockResolvedValue(0 as any);

      const { req, res } = mockReqRes({
        query: { page: '1', limit: '20' }
      });

      await getProblems(req, res);

      expect(res.statusCode).toBe(200);
      expect(capturedFilter.isCustomPractice).toEqual({ $ne: true });
    });
  });

  // =========================================================================
  // 7. Submission Sandbox Gatekeeper Authorization (createSubmission)
  // =========================================================================
  describe('7. Submission Sandbox Authorization for Practice Problems', () => {
    it('authorizes the owner student to submit code on their PRACTICE problem without admin approval', async () => {
      const studentId = 'student_author_1';
      const mockProblemId = new mongoose.Types.ObjectId();

      const mockPracticeProblem: any = {
        _id: mockProblemId,
        title: 'Custom Trie Implementation',
        slug: 'custom-trie-impl-practice',
        status: 'PRACTICE',
        isCustomPractice: true,
        practiceVisibility: 'PRIVATE',
        createdBy: studentId,
        testCases: [{ input: 'insert("apple")', expectedOutput: 'null' }]
      };

      vi.spyOn(ProblemModel, 'findById').mockResolvedValue(mockPracticeProblem);
      vi.spyOn(SubmissionModel, 'create').mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        problemId: mockProblemId.toString(),
        userId: studentId,
        verdict: 'PENDING'
      } as any);

      const { req, res } = mockReqRes({
        user: { id: studentId, username: 'student_author_1', role: 'STUDENT' },
        body: {
          problemId: mockProblemId.toString(),
          language: 'python',
          code: 'class Trie:\n    pass',
          isTestRun: false
        }
      });

      await createSubmission(req, res);

      expect(res.statusCode).toBe(202);
      expect(res.data.success).toBe(true);
      expect(res.data.data.submissionId).toBeDefined();
    });

    it('rejects an unauthorized user attempting to submit to a private practice problem of another user', async () => {
      const ownerId = 'student_author_1';
      const intruderId = 'student_intruder_2';
      const mockProblemId = new mongoose.Types.ObjectId();

      const mockPrivateProblem: any = {
        _id: mockProblemId,
        title: 'Secret Practice Challenge',
        slug: 'secret-practice-challenge',
        status: 'PRACTICE',
        isCustomPractice: true,
        practiceVisibility: 'PRIVATE',
        createdBy: ownerId
      };

      vi.spyOn(ProblemModel, 'findById').mockResolvedValue(mockPrivateProblem);

      const { req, res } = mockReqRes({
        user: { id: intruderId, username: 'intruder', role: 'STUDENT' },
        body: {
          problemId: mockProblemId.toString(),
          language: 'python',
          code: 'print("attempt")',
          isTestRun: false
        }
      });

      await createSubmission(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.data.error.code).toBe('NOT_FOUND');
    });
  });

  // =========================================================================
  // 8. Instant AI Practice Generator (generateAIPracticeProblem)
  // =========================================================================
  describe('8. Instant AI Practice Generator Controller', () => {
    it('creates an AI-assisted practice problem from topic prompt and redirects to workspace', async () => {
      const studentUser = { id: 'student_ai_user', username: 'ai_learner', role: 'STUDENT' };

      vi.spyOn(practiceGeminiClient, 'generateProblemMaterials').mockResolvedValue({
        title: 'Two Pointers Sliding Window Practice',
        difficulty: 'MEDIUM',
        tags: ['Two-Pointers', 'Sliding-Window'],
        description: 'Find max subarray window length.',
        constraints: ['1 <= n <= 10^5'],
        examples: [{ input: '[1,2,3]', output: '3' }],
        starterCode: { typescript: 'function maxWindow() {}' },
        testCases: [{ id: 'tc-1', input: '[1,2,3]', expectedOutput: '3', isHidden: false }]
      } as any);

      vi.spyOn(ProblemModel, 'findOne').mockResolvedValue(null);
      vi.spyOn(ProblemModel, 'create').mockImplementation(async (doc: any) => ({
        ...doc,
        _id: new mongoose.Types.ObjectId()
      }));

      const { req, res } = mockReqRes({
        user: studentUser,
        body: {
          topic: 'Two Pointers Sliding Window',
          difficulty: 'MEDIUM',
          language: 'typescript'
        }
      });

      await generateAIPracticeProblem(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.data.success).toBe(true);
      const generated = res.data.data;
      expect(generated.status).toBe('PRACTICE');
      expect(generated.isCustomPractice).toBe(true);
      expect(generated.authorMetadata.isAIAssisted).toBe(true);
    });
  });
});
