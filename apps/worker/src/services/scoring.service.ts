import {
  Verdict,
  LANGUAGE_CONFIGS,
  SupportedLanguage,
  SCORING_WEIGHTS,
  DEFAULT_RESOURCE_LIMITS
} from '@aica/shared';

export interface ScoringInput {
  verdict: Verdict;
  passedCount: number;
  totalCount: number;
  language: SupportedLanguage;
  executionTimeMs: number;
  memoryUsedKb: number;
  aiQualityScore?: number; // 1 to 10
  targetTimeMs?: number;
  timeLimitMs?: number;
  memoryLimitKb?: number;
}

export interface ScoringResult {
  isEligible: boolean;
  normalizedTimeMs: number;
  normalizedMemoryKb: number;
  timeScore: number;
  memoryScore: number;
  qualityScore: number;
  compositeScore: number;
}

export class ScoringService {
  public static calculate(input: ScoringInput): ScoringResult {
    // 1. Mandatory Correctness Gate
    const isEligible = input.verdict === 'ACCEPTED' && input.passedCount === input.totalCount && input.totalCount > 0;

    const langConfig = LANGUAGE_CONFIGS[input.language] || LANGUAGE_CONFIGS.python;
    const multiplier = langConfig.multiplier || 1.0;
    const memOffset = langConfig.memoryOffsetKb || 0;

    // 2. Language-Normalized Hardware Metrics
    const normalizedTimeMs = Math.round((input.executionTimeMs / multiplier) * 10) / 10;
    const normalizedMemoryKb = Math.max(1024, input.memoryUsedKb - memOffset);

    if (!isEligible) {
      return {
        isEligible: false,
        normalizedTimeMs,
        normalizedMemoryKb,
        timeScore: 0,
        memoryScore: 0,
        qualityScore: 0,
        compositeScore: 0.0
      };
    }

    // 3. Logarithmic Distance Scoring relative to target
    const targetTime = input.targetTimeMs || 15;
    const timeLimit = input.timeLimitMs || DEFAULT_RESOURCE_LIMITS.TIME_LIMIT_MS;
    const targetMem = 2048; // 2MB
    const memLimit = input.memoryLimitKb || DEFAULT_RESOURCE_LIMITS.MEMORY_LIMIT_KB;

    // Clamp normalized time between target and limit
    const clampedTime = Math.max(targetTime, Math.min(normalizedTimeMs, timeLimit));
    const timeScore = Math.min(
      100,
      Math.max(
        0,
        100 * ((Math.log(timeLimit) - Math.log(clampedTime)) / (Math.log(timeLimit) - Math.log(targetTime)))
      )
    );

    // Memory score
    const clampedMem = Math.max(targetMem, Math.min(normalizedMemoryKb, memLimit));
    const memoryScore = Math.min(
      100,
      Math.max(
        0,
        100 * ((Math.log(memLimit) - Math.log(clampedMem)) / (Math.log(memLimit) - Math.log(targetMem)))
      )
    );

    // AI Quality score (1 - 10 scaled to 0 - 100)
    const rawQuality = input.aiQualityScore || 7.5;
    const qualityScore = Math.min(100, Math.max(0, rawQuality * 10));

    // 4. Weighted Composite Score
    const composite =
      SCORING_WEIGHTS.TIME * timeScore +
      SCORING_WEIGHTS.MEMORY * memoryScore +
      SCORING_WEIGHTS.QUALITY * qualityScore;

    return {
      isEligible: true,
      normalizedTimeMs,
      normalizedMemoryKb,
      timeScore: Math.round(timeScore * 10) / 10,
      memoryScore: Math.round(memoryScore * 10) / 10,
      qualityScore: Math.round(qualityScore * 10) / 10,
      compositeScore: Math.round(composite * 10) / 10
    };
  }
}
