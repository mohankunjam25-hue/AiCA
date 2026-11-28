import { useState, useEffect } from 'react';
import axios from 'axios';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useDataCacheStore } from '../store/useDataCacheStore';

export interface CatalogProblemSpotlight {
  id: string;
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  description?: string;
  totalSubmissions?: number;
  acceptanceRate?: number | null;
}

export interface CatalogSummaryData {
  totalProblems: number;
  byDifficulty: { easy: number; medium: number; hard: number };
  topicCounts: Record<string, number>;
  topics: Array<{ tag: string; count: number }>;
  dailyChallenge: CatalogProblemSpotlight | null;
  spotlights: CatalogProblemSpotlight[];
}

export interface UserProgressSummaryData {
  activityByDate: Record<string, number>;
  totalSubmissions: number;
  problemsSolved: number;
  currentStreak: number;
  longestStreak: number;
  solvedToday: boolean;
  difficultyBreakdown: { easy: number; medium: number; hard: number };
  languageBreakdown: Array<{ language: string; count: number; percentage: number }>;
  masteredTopics: Array<{ tag: string; count: number }>;
  avgEvolutionDelta: number | null;
}

const CATALOG_CACHE_KEY = 'platform_catalog_summary';

export function useCatalogSummary() {
  const initialCache = useDataCacheStore.getState().get<CatalogSummaryData>(CATALOG_CACHE_KEY, 5 * 60 * 1000);
  const [summary, setSummary] = useState<CatalogSummaryData | null>(initialCache);
  const [loading, setLoading] = useState(!initialCache);

  useEffect(() => {
    const freshCache = useDataCacheStore.getState().get<CatalogSummaryData>(CATALOG_CACHE_KEY, 5 * 60 * 1000);
    if (freshCache) {
      setSummary(freshCache);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const loadSummary = async () => {
      try {
        const res = await api.get('/problems/summary', { signal: controller.signal });
        if (isMounted && res.data?.success && res.data?.data) {
          useDataCacheStore.getState().set(CATALOG_CACHE_KEY, res.data.data);
          setSummary(res.data.data);
        }
      } catch (err: any) {
        if (!axios.isCancel(err) && err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
          console.warn('[useCatalogSummary] Failed to fetch catalog summary:', err?.message);
        }
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadSummary();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  return { summary, loading };
}

export function useUserProgressSummary(enabled = true) {
  const userId = useAuthStore((s) => s.user?.id);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const shouldFetch = enabled && isAuthenticated && Boolean(userId);
  const cacheKey = `user_progress_${userId || 'anon'}`;

  const initialCache = shouldFetch
    ? useDataCacheStore.getState().get<UserProgressSummaryData>(cacheKey, 60 * 1000)
    : null;
  const [progress, setProgress] = useState<UserProgressSummaryData | null>(initialCache);
  const [loading, setLoading] = useState(shouldFetch && !initialCache);

  useEffect(() => {
    if (!shouldFetch) {
      setProgress(null);
      setLoading(false);
      return;
    }

    const freshCache = useDataCacheStore.getState().get<UserProgressSummaryData>(cacheKey, 60 * 1000);
    if (freshCache) {
      setProgress(freshCache);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const loadProgress = async () => {
      try {
        const res = await api.get('/submissions/activity-heatmap', { signal: controller.signal });
        if (isMounted && res.data?.success && res.data?.data) {
          useDataCacheStore.getState().set(cacheKey, res.data.data);
          setProgress(res.data.data);
        }
      } catch (err: any) {
        if (!axios.isCancel(err) && err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
          console.warn('[useUserProgressSummary] Failed to fetch user progress:', err?.message);
        }
      } finally {
        if (isMounted && !controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadProgress();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [cacheKey, shouldFetch]);

  return { progress, loading };
}
