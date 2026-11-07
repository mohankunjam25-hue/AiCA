import { SupportedLanguage } from '../constants/languages.js';

export interface LeaderboardScoreBreakdown {
  rawTimeMs: number;
  normalizedTimeMs: number;
  timeScore: number;
  rawMemoryKb: number;
  normalizedMemoryKb: number;
  memoryScore: number;
  qualityScore: number;
  qualityPoints: number;
  formula: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  submissionId: string;
  language: SupportedLanguage;
  compositeScore: number;
  breakdown: LeaderboardScoreBreakdown;
  submittedAt: string;
}

export interface ProblemLeaderboardResponse {
  problemId: string;
  totalRanked: number;
  rankings: LeaderboardEntry[];
}

export interface GlobalLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  problemsSolved: number;
  totalScore: number;
  avgRuntimeMs: number;
  streak: number;
  lastActiveAt?: string;
}

export interface GlobalLeaderboardResponse {
  totalRanked: number;
  page: number;
  limit: number;
  rankings: GlobalLeaderboardEntry[];
}

export interface DeveloperSolvedProblemItem {
  problemId: string;
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  language: SupportedLanguage;
  bestRuntimeMs: number;
  bestMemoryKb: number;
  compositeScore: number;
  solvedAt: string;
}

export interface DeveloperSolvedProfile {
  userId: string;
  username: string;
  avatarUrl?: string;
  rank?: number;
  league: string;
  totalSolved: number;
  totalScore: number;
  streak: number;
  difficultyBreakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface DeveloperSolvedResponse {
  developer: DeveloperSolvedProfile;
  solvedProblems: DeveloperSolvedProblemItem[];
}

