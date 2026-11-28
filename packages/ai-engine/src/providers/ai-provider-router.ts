import { GoogleGenAI } from '@google/genai';

export type AiProviderName = 'groq' | 'cerebras' | 'openrouter' | 'mistral' | 'ollama' | 'gemini';

export interface AiGenerationResult {
  text: string;
  provider: AiProviderName;
  model: string;
}

export interface AiRouterConfig {
  explicitGeminiKey?: string;
  explicitGeminiModel?: string;
  providerOrder?: AiProviderName[];
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

interface ResolvedProvider {
  name: AiProviderName;
  kind: 'openai_compat' | 'gemini';
  endpoint?: string;
  apiKey: string;
  model: string;
  extraHeaders?: Record<string, string>;
}

const DEFAULT_PROVIDER_ORDER: AiProviderName[] = [
  'groq',
  'cerebras',
  'openrouter',
  'mistral',
  'gemini',
  'ollama'
];

export function cleanJsonText(raw?: string): string {
  if (!raw) return '{}';
  const stripped = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  // If LLM included conversational text around a JSON object, extract outermost braces cleanly
  if (!stripped.startsWith('{') && !stripped.startsWith('[')) {
    const firstObj = stripped.indexOf('{');
    const lastObj = stripped.lastIndexOf('}');
    if (firstObj !== -1 && lastObj > firstObj) {
      return stripped.slice(firstObj, lastObj + 1);
    }
  }
  return stripped;
}

function isUsableKey(key?: string): key is string {
  if (!key) return false;
  const trimmed = key.trim();
  return (
    trimmed.length > 5 &&
    trimmed !== 'your_google_gemini_api_key_here' &&
    trimmed !== 'your_api_key_here'
  );
}

function parseProviderOrder(raw?: string): AiProviderName[] {
  if (!raw || !raw.trim()) return DEFAULT_PROVIDER_ORDER;
  const valid = new Set<AiProviderName>(DEFAULT_PROVIDER_ORDER);
  const parsed = raw
    .split(',')
    .map((s) => s.trim().toLowerCase() as AiProviderName)
    .filter((s) => valid.has(s));
  // Append any unmentioned defaults at the end so fallbacks stay available
  for (const d of DEFAULT_PROVIDER_ORDER) {
    if (!parsed.includes(d)) parsed.push(d);
  }
  return parsed;
}

function classifyCooldownMs(err: any): number {
  const status = err?.status || err?.statusCode;
  const msg = String(err?.message || '').toLowerCase();

  if (
    status === 402 ||
    status === 401 ||
    status === 403 ||
    msg.includes('credit') ||
    msg.includes('insufficient') ||
    msg.includes('billing')
  ) {
    return 5 * 60 * 1000; // 5 minutes for credit/auth issues
  }
  if (status === 429 || msg.includes('rate limit') || msg.includes('quota') || msg.includes('resource_exhausted')) {
    return 90 * 1000; // 90 seconds for rate limits
  }
  return 30 * 1000; // 30 seconds for transient 5xx / timeout / malformed JSON
}

export class AiProviderRouter {
  private static cooldownUntil = new Map<AiProviderName, number>();
  private readonly geminiInstances = new Map<string, GoogleGenAI>();
  private readonly config: AiRouterConfig;

  constructor(config: AiRouterConfig = {}) {
    this.config = config;
  }

  public static clearCooldowns(): void {
    AiProviderRouter.cooldownUntil.clear();
  }

  public static getCooldownStatus(): Record<string, number> {
    const now = Date.now();
    const out: Record<string, number> = {};
    for (const [provider, until] of AiProviderRouter.cooldownUntil.entries()) {
      if (until > now) {
        out[provider] = Math.ceil((until - now) / 1000);
      }
    }
    return out;
  }

  private resolveProviders(): ResolvedProvider[] {
    let order = this.config.providerOrder || parseProviderOrder(process.env.AI_PROVIDER_ORDER);

    // Honor explicit constructor Gemini key first while keeping configured fallbacks
    if (isUsableKey(this.config.explicitGeminiKey)) {
      order = ['gemini', ...order.filter((p) => p !== 'gemini')];
    }

    const providers: ResolvedProvider[] = [];

    for (const name of order) {
      if (name === 'groq' && isUsableKey(process.env.GROQ_API_KEY)) {
        providers.push({
          name: 'groq',
          kind: 'openai_compat',
          endpoint: 'https://api.groq.com/openai/v1/chat/completions',
          apiKey: process.env.GROQ_API_KEY.trim(),
          model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b'
        });
      } else if (name === 'cerebras' && isUsableKey(process.env.CEREBRAS_API_KEY)) {
        providers.push({
          name: 'cerebras',
          kind: 'openai_compat',
          endpoint: 'https://api.cerebras.ai/v1/chat/completions',
          apiKey: process.env.CEREBRAS_API_KEY.trim(),
          model: process.env.CEREBRAS_MODEL || 'llama-3.3-70b'
        });
      } else if (name === 'openrouter' && isUsableKey(process.env.OPENROUTER_API_KEY)) {
        providers.push({
          name: 'openrouter',
          kind: 'openai_compat',
          endpoint: 'https://openrouter.ai/api/v1/chat/completions',
          apiKey: process.env.OPENROUTER_API_KEY.trim(),
          model: process.env.OPENROUTER_MODEL || 'openrouter/free',
          extraHeaders: {
            'HTTP-Referer': process.env.FRONTEND_URL || 'https://ai-ca-six.vercel.app',
            'X-Title': 'AiCA Code Evolution Lab'
          }
        });
      } else if (name === 'mistral' && isUsableKey(process.env.MISTRAL_API_KEY)) {
        providers.push({
          name: 'mistral',
          kind: 'openai_compat',
          endpoint: 'https://api.mistral.ai/v1/chat/completions',
          apiKey: process.env.MISTRAL_API_KEY.trim(),
          model: process.env.MISTRAL_MODEL || 'mistral-small-latest'
        });
      } else if (name === 'ollama' && process.env.OLLAMA_BASE_URL?.trim()) {
        const base = process.env.OLLAMA_BASE_URL.trim().replace(/\/+$/, '');
        const endpoint = base.endsWith('/chat/completions') ? base : `${base}/v1/chat/completions`;
        providers.push({
          name: 'ollama',
          kind: 'openai_compat',
          endpoint,
          apiKey: process.env.OLLAMA_API_KEY?.trim() || 'ollama',
          model: process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b'
        });
      } else if (name === 'gemini') {
        const geminiKey = isUsableKey(this.config.explicitGeminiKey)
          ? this.config.explicitGeminiKey
          : isUsableKey(process.env.GEMINI_API_KEY)
          ? process.env.GEMINI_API_KEY.trim()
          : undefined;
        if (geminiKey) {
          providers.push({
            name: 'gemini',
            kind: 'gemini',
            apiKey: geminiKey,
            model: this.config.explicitGeminiModel || process.env.GEMINI_MODEL || 'gemini-flash-lite-latest'
          });
        }
      }
    }

    return providers;
  }

  private getGeminiClient(apiKey: string, timeoutMs: number): GoogleGenAI {
    let client = this.geminiInstances.get(apiKey);
    if (!client) {
      client = new GoogleGenAI({ apiKey, httpOptions: { timeout: timeoutMs } });
      this.geminiInstances.set(apiKey, client);
    }
    return client;
  }

  private async callOpenAICompatible(
    provider: ResolvedProvider,
    prompt: string,
    timeoutMs: number,
    useJsonObjectFormat = true
  ): Promise<string> {
    const fetchImpl = this.config.fetchFn || fetch;
    const body: Record<string, any> = {
      model: provider.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert software engineer. Return valid JSON only matching the requested schema. Do not include markdown fences or extra commentary.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2
    };

    if (useJsonObjectFormat) {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetchImpl(provider.endpoint!, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
        ...(provider.extraHeaders || {})
      },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify(body)
    });

    let data: any = {};
    if (typeof (res as any).text === 'function') {
      const rawBody = await res.text();
      if (rawBody) {
        try {
          data = JSON.parse(rawBody);
        } catch {
          data = {};
        }
      }
    } else if (typeof res.json === 'function') {
      data = await res.json().catch((err: any) => {
        if (err?.name === 'AbortError' || err?.name === 'TimeoutError') throw err;
        return {};
      });
    }
    if (!res.ok) {
      const errMsg = data?.error?.message || data?.message || `HTTP ${res.status} from ${provider.name}`;
      // Some open-source free models reject strict response_format=json_object -> retry once without it
      if (
        res.status === 400 &&
        useJsonObjectFormat &&
        (errMsg.toLowerCase().includes('response_format') || errMsg.toLowerCase().includes('json_object'))
      ) {
        return this.callOpenAICompatible(provider, prompt, timeoutMs, false);
      }
      const err: any = new Error(errMsg);
      err.status = res.status;
      throw err;
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error(`Empty response content from provider ${provider.name}`);
    }
    return content;
  }

  private async callGemini(
    provider: ResolvedProvider,
    prompt: string,
    geminiResponseSchema?: any,
    timeoutMs = 15000
  ): Promise<string> {
    const ai = this.getGeminiClient(provider.apiKey, timeoutMs);
    const config: Record<string, any> = { responseMimeType: 'application/json' };
    if (geminiResponseSchema) {
      config.responseSchema = geminiResponseSchema;
    }
    const response = await ai.models.generateContent({
      model: provider.model,
      contents: prompt,
      config
    });
    return response.text || '{}';
  }

  public async generateJson(
    prompt: string,
    options?: {
      geminiResponseSchema?: any;
      validate?: (parsed: any) => void;
    }
  ): Promise<AiGenerationResult> {
    const providers = this.resolveProviders();
    if (providers.length === 0) {
      throw new Error(
        'AI_CONFIG_ERROR: No AI provider API key configured. Set GROQ_API_KEY, CEREBRAS_API_KEY, OPENROUTER_API_KEY, or GEMINI_API_KEY in environment variables.'
      );
    }

    const timeoutMs = this.config.timeoutMs || 45000;
    const now = Date.now();

    // Try non-cooled providers first; if all are in cooldown, try earliest-expiring provider once
    const readyProviders = providers.filter(
      (p) => (AiProviderRouter.cooldownUntil.get(p.name) || 0) <= now
    );
    const orderedCandidates =
      readyProviders.length > 0
        ? readyProviders
        : [...providers].sort(
            (a, b) =>
              (AiProviderRouter.cooldownUntil.get(a.name) || 0) -
              (AiProviderRouter.cooldownUntil.get(b.name) || 0)
          );

    const errors: string[] = [];

    for (const provider of orderedCandidates) {
      try {
        const rawText =
          provider.kind === 'gemini'
            ? await this.callGemini(provider, prompt, options?.geminiResponseSchema, timeoutMs)
            : await this.callOpenAICompatible(provider, prompt, timeoutMs);

        const cleaned = cleanJsonText(rawText);
        const parsed = JSON.parse(cleaned);
        if (options?.validate) {
          options.validate(parsed);
        }

        // Clear any old cooldown on success
        AiProviderRouter.cooldownUntil.delete(provider.name);

        return {
          text: cleaned,
          provider: provider.name,
          model: provider.model
        };
      } catch (err: any) {
        const cooldownMs = classifyCooldownMs(err);
        AiProviderRouter.cooldownUntil.set(provider.name, Date.now() + cooldownMs);
        const message = err?.message || String(err);
        errors.push(`${provider.name}(${provider.model}): ${message}`);
        console.warn(
          `[AiProviderRouter] Provider "${provider.name}" failed (${message}). Cooldown ${Math.round(cooldownMs / 1000)}s, failing over...`
        );
      }
    }

    throw new Error(`All configured AI providers failed: ${errors.join(' | ')}`);
  }
}
