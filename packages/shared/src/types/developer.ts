import { SupportedLanguage } from '../constants/languages.js';

export interface DeveloperSolvedItem {
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
  isCodeLocked: boolean;
  code?: string; // Included ONLY if viewer is following or is self
  aiAnalysisSummary?: string;
}

export interface DeveloperSkillMastery {
  tag: string;
  count: number;
  percentage: number;
}

export interface DeveloperFullProfile {
  userId: string;
  username: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  githubHandle?: string;
  rank?: number;
  league: string;
  totalSolved: number;
  totalScore: number;
  streak: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isSelf: boolean;
  joinedAt?: string;
  difficultyBreakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
  skills: DeveloperSkillMastery[];
}

export interface DeveloperProfileResponse {
  developer: DeveloperFullProfile;
  solvedProblems: DeveloperSolvedItem[];
}

export interface DeveloperDirectoryItem {
  userId: string;
  username: string;
  fullName?: string;
  avatarUrl?: string;
  league: string;
  totalSolved: number;
  totalScore: number;
  streak: number;
  topSkills: string[];
  followerCount: number;
  isFollowing: boolean;
}

export interface DeveloperDirectoryResponse {
  total: number;
  page: number;
  limit: number;
  developers: DeveloperDirectoryItem[];
}
