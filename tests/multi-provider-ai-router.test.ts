import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AiProviderRouter,
  GeminiAnalysisClient,
  OpenAIAlgorithmClient,
  cleanJsonText
} from '../packages/ai-engine/src/index.js';
import {
  AiEvaluatorService,
  computeNormalizedCodeHash
} from '../apps/worker/src/services/ai-evaluator.service.js';

describe('Option 2: Multi-Provider Free AI Router & Code-Hash Caching', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    AiProviderRouter.clearCooldowns();
    process.env = { ...originalEnv };
    delete process.env.GROQ_API_KEY;
    delete process.env.CEREBRAS_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.MISTRAL_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.OLLAMA_BASE_URL;
    delete process.env.AI_PROVIDER_ORDER;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    AiProviderRouter.clearCooldowns();
    vi.restoreAllMocks();
  });

  it('cleanJsonText extracts valid JSON even with surrounding prose or markdown fences', () => {
    expect(cleanJsonText('```json\n{"a":1}\n```')).toBe('{"a":1}');
    expect(cleanJsonText('Here is your result:\n{"timeComplexity":"O(N)"}\nDone!')).toBe(
      '{"timeComplexity":"O(N)"}'
    );
  });

  it('throws AI_CONFIG_ERROR when no AI provider key is configured', async () => {
    const client = new GeminiAnalysisClient();
    await expect(
      client.analyzeComparison({
        problemTitle: 'Two Sum',
        languageA: 'python',
        codeA: 'a',
        timeMsA: 10,
        memoryKbA: 1000,
        languageB: 'python',
        codeB: 'b',
        timeMsB: 5,
        memoryKbB: 1000
      })
    ).rejects.toThrow('AI_CONFIG_ERROR');
  });

  it('fails over immediately from Groq (429) -> Cerebras (402) -> OpenRouter (200) and cools down failed providers', async () => {
    process.env.GROQ_API_KEY = 'gsk_test_key_123';
    process.env.CEREBRAS_API_KEY = 'csk_test_key_123';
    process.env.OPENROUTER_API_KEY = 'sk-or-v1-test_key_123';

    const calls: string[] = [];
    const mockFetch = vi.fn(async (url: any) => {
      calls.push(String(url));
      if (String(url).includes('groq.com')) {
        return {
          ok: false,
          status: 429,
          json: async () => ({ error: { message: 'Rate limit reached' } })
        } as any;
      }
      if (String(url).includes('cerebras.ai')) {
        return {
          ok: false,
          status: 402,
          json: async () => ({ error: { message: 'Insufficient credits' } })
        } as any;
      }
      if (String(url).includes('openrouter.ai')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    timeComplexityComparison: 'O(N) vs O(N^2)',
                    spaceComplexityComparison: 'O(N) vs O(1)',
                    tradeOffSummary: 'Hash map trades O(N) memory for linear speed.',
                    architecturalEvolution: 'Replaced nested scan with lookup table.'
                  })
                }
              }
            ]
          })
        } as any;
      }
      throw new Error(`Unexpected URL: ${url}`);
    });

    const router = new AiProviderRouter({ fetchFn: mockFetch as any });
    const client = new GeminiAnalysisClient(undefined, undefined, router);

    const res1 = await client.analyzeComparison({
      problemTitle: 'Two Sum',
      languageA: 'python',
      codeA: 'for i...',
      timeMsA: 120,
      memoryKbA: 14000,
      languageB: 'python',
      codeB: 'seen={}',
      timeMsB: 12,
      memoryKbB: 16000
    });

    expect(res1.timeComplexityComparison).toBe('O(N) vs O(N^2)');
    expect(calls).toHaveLength(3);
    expect(AiProviderRouter.getCooldownStatus()).toHaveProperty('groq');
    expect(AiProviderRouter.getCooldownStatus()).toHaveProperty('cerebras');

    // Second request must skip cooled-down groq & cerebras and hit openrouter directly
    calls.length = 0;
    const res2 = await client.analyzeComparison({
      problemTitle: 'Two Sum',
      languageA: 'python',
      codeA: 'for i...',
      timeMsA: 120,
      memoryKbA: 14000,
      languageB: 'python',
      codeB: 'seen={}',
      timeMsB: 12,
      memoryKbB: 16000
    });

    expect(res2.tradeOffSummary).toContain('Hash map');
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('openrouter.ai');
  });

  it('OpenAIAlgorithmClient falls back to free AI router when OPENAI_API_KEY is not set', async () => {
    process.env.GROQ_API_KEY = 'gsk_free_key_999';

    const mockFetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                isAlgorithm: true,
                name: 'Binary Search',
                category: 'Searching',
                description: 'Divides sorted search space in half each step.',
                timeComplexity: 'O(log N)',
                spaceComplexity: 'O(1)',
                code: {
                  javascript: 'function bs(arr, t) { return -1; }',
                  python: 'def bs(arr, t): return -1'
                },
                steps: ['Initialize left and right pointers', 'Compute mid index', 'Narrow search interval']
              })
            }
          }
        ]
      })
    }));

    const router = new AiProviderRouter({ fetchFn: mockFetch as any });
    const algoClient = new OpenAIAlgorithmClient(undefined, undefined, router);

    const algo = await algoClient.generateAlgorithm('Binary Search');
    expect(algo.isAlgorithm).toBe(true);
    expect(algo.name).toBe('Binary Search');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('reuses cached AI evaluation via normalized code-hash with zero extra AI API calls', async () => {
    const codeV1 = `def isPalindrome(s):\n    left, right = 0, len(s) - 1\n    return True`;
    const codeV2 = `# Different comment\ndef isPalindrome(s):\n    left, right = 0, len(s) - 1   \n    return True`;

    expect(computeNormalizedCodeHash('prob1', 'python', 'ACCEPTED', codeV1)).toBe(
      computeNormalizedCodeHash('prob1', 'python', 'ACCEPTED', codeV2)
    );

    const reportsStore = new Map<string, any>();
    const mockReportsCol = {
      async findOne(query: any) {
        if (query.codeHash) {
          for (const doc of reportsStore.values()) {
            if (doc.codeHash === query.codeHash && doc.aiAnalysis?.status === 'COMPLETED') {
              return { ...doc };
            }
          }
          return null;
        }
        if (query.submissionId) {
          for (const doc of reportsStore.values()) {
            if (doc.submissionId === query.submissionId) return { ...doc };
          }
        }
        return null;
      },
      async updateOne(filter: any, update: any) {
        for (const doc of reportsStore.values()) {
          if (doc._id === filter._id) {
            Object.assign(doc, update.$set);
          }
        }
      },
      async insertOne(doc: any) {
        const id = `rep_${reportsStore.size + 1}`;
        reportsStore.set(id, { ...doc, _id: id });
        return { insertedId: id };
      }
    };

    const sub1Id = '654321654321654321654301';
    const sub2Id = '654321654321654321654302';
    const subsMap = new Map<string, any>([
      [sub1Id, { _id: sub1Id, verdict: 'ACCEPTED', compositeScore: 90 }],
      [sub2Id, { _id: sub2Id, verdict: 'ACCEPTED', compositeScore: 91 }]
    ]);
    const mockSubmissionsCol = {
      async findOne(q: any) {
        return subsMap.get(q._id.toString()) || null;
      },
      async updateOne() {}
    };
    const mockProblemsCol = {
      async findOne() {
        return { title: 'Valid Palindrome', description: 'Check palindrome', constraints: [] };
      }
    };

    const mockDb: any = {
      collection: (name: string) => {
        if (name === 'submissions') return mockSubmissionsCol;
        if (name === 'problems') return mockProblemsCol;
        if (name === 'evaluation_reports') return mockReportsCol;
        return null;
      }
    };

    const analyzeMock = vi.fn().mockResolvedValue({
      status: 'COMPLETED',
      mode: 'OPTIMIZATION',
      codeSummary: 'Optimal O(N) two-pointer pass.',
      theoreticalComplexity: { timeComplexity: 'O(N)', spaceComplexity: 'O(1)', explanation: 'Single pass' },
      codeQuality: { score: 9, readabilityAnalysis: 'Clean', codeSmells: [], positivePractices: ['Two pointers'] },
      optimizationSuggestions: []
    });

    const service = new AiEvaluatorService({ analyzeAcceptedSolution: analyzeMock } as any);

    await service.evaluateSubmissionAi(
      {
        submissionId: sub1Id,
        problemId: '123456123456123456123456',
        userId: 'u1',
        username: 'alice',
        language: 'python',
        code: codeV1,
        verdict: 'ACCEPTED',
        executionTimeMs: 12,
        memoryUsedKb: 10000,
        passedCount: 5,
        totalCount: 5
      },
      { db: mockDb }
    );

    await service.evaluateSubmissionAi(
      {
        submissionId: sub2Id,
        problemId: '123456123456123456123456',
        userId: 'u2',
        username: 'bob',
        language: 'python',
        code: codeV2,
        verdict: 'ACCEPTED',
        executionTimeMs: 14,
        memoryUsedKb: 10500,
        passedCount: 5,
        totalCount: 5
      },
      { db: mockDb }
    );

    // Only called ONCE even though 2 submissions with identical normalized logic ran!
    expect(analyzeMock).toHaveBeenCalledTimes(1);
    const bobReport = await mockReportsCol.findOne({ submissionId: sub2Id });
    expect(bobReport.aiAnalysis.codeSummary).toBe('Optimal O(N) two-pointer pass.');
  });
});
