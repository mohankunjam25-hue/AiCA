import {
  Zap,
  Clock,
  HardDrive,
  Flame,
  Code2,
  ShieldCheck,
  Award
} from 'lucide-react';

export interface UserSubmissionSummary {
  id: string;
  problemId: string;
  problemTitle?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'EASY' | 'MEDIUM' | 'HARD';
  language: string;
  verdict: string;
  runtimeMs?: number;
  executionTimeMs?: number;
  memoryKb?: number;
  memoryUsedKb?: number;
  createdAt?: string;
}

export interface UserStatsSummary {
  solved: number;
  total: number;
  streak: number;
  longestStreak: number;
}

export interface DynamicBadge {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  unlocked: boolean;
  progressText: string;
  percent: number;
  earnedAt?: string;
}

export function calculateUserBadges(
  submissions: UserSubmissionSummary[],
  stats: UserStatsSummary
): DynamicBadge[] {
  const acceptedSubs = submissions.filter((s) => s.verdict === 'ACCEPTED');
  
  // 1. First Blood: Solved >= 1 problem
  const hasFirstBlood = acceptedSubs.length >= 1 || stats.solved >= 1;
  const firstBloodProgress = Math.min(1, stats.solved > 0 ? stats.solved : acceptedSubs.length);

  // 2. Sub-10ms Sprinter: Fastest accepted submission < 10ms
  let minRuntime = Infinity;
  for (const sub of acceptedSubs) {
    const time = sub.runtimeMs ?? sub.executionTimeMs ?? Infinity;
    if (time < minRuntime) minRuntime = time;
  }
  const isSub10ms = minRuntime < 10 && minRuntime !== Infinity;

  // 3. Quadratic Slayer: Solved at least 1 Medium or Hard problem
  const mediumOrHardSolved = acceptedSubs.some((s) => {
    const d = (s.difficulty || '').toUpperCase();
    return d === 'MEDIUM' || d === 'HARD';
  });

  // 4. 5-Day Evolution Streak: Current or longest streak >= 5
  const streak = Math.max(stats.streak || 0, stats.longestStreak || 0);
  const is5DayStreak = streak >= 5;

  // 5. Polyglot Architect: Solved problems across >= 3 languages
  const uniqueLanguages = new Set(
    acceptedSubs.map((s) => (s.language || '').toLowerCase().trim()).filter(Boolean)
  );
  const langCount = uniqueLanguages.size;
  const isPolyglot = langCount >= 3;

  // 6. Kernel Isolation Master: Total submissions >= 25
  const totalSubs = Math.max(stats.total || 0, submissions.length);
  const isMaster = totalSubs >= 25;

  return [
    {
      id: 'badge-1',
      name: 'First Blood',
      description: 'Successfully authored an accepted solution verified by sandboxed tests',
      icon: Award,
      color: 'from-blue-500 to-indigo-600',
      unlocked: hasFirstBlood,
      progressText: hasFirstBlood ? 'Completed' : '0/1 Problem Solved',
      percent: hasFirstBlood ? 100 : 0,
      earnedAt: hasFirstBlood ? 'Unlocked' : undefined
    },
    {
      id: 'badge-2',
      name: 'Sub-10ms Sprinter',
      description: 'Passed 100% hidden Judge test cases in under 10 milliseconds',
      icon: Clock,
      color: 'from-emerald-500 to-teal-500',
      unlocked: isSub10ms,
      progressText: isSub10ms
        ? `Fastest: ${minRuntime}ms`
        : minRuntime !== Infinity
        ? `Best: ${minRuntime}ms (Target: <10ms)`
        : 'Target: <10ms',
      percent: isSub10ms ? 100 : minRuntime !== Infinity ? Math.min(90, Math.round((10 / minRuntime) * 100)) : 0,
      earnedAt: isSub10ms ? 'Unlocked' : undefined
    },
    {
      id: 'badge-3',
      name: 'Quadratic Slayer',
      description: 'Conquered algorithmic complexity on a Medium or Hard problem',
      icon: Zap,
      color: 'from-amber-500 to-emerald-500',
      unlocked: mediumOrHardSolved,
      progressText: mediumOrHardSolved ? 'Medium/Hard Mastered' : '0/1 Medium/Hard Solved',
      percent: mediumOrHardSolved ? 100 : 0,
      earnedAt: mediumOrHardSolved ? 'Unlocked' : undefined
    },
    {
      id: 'badge-4',
      name: '5-Day Evolution Streak',
      description: 'Submitted algorithmic solutions across 5 daily calendar sessions',
      icon: Flame,
      color: 'from-rose-500 to-amber-500',
      unlocked: is5DayStreak,
      progressText: `Streak: ${Math.min(5, streak)}/5 days`,
      percent: Math.min(100, Math.round((streak / 5) * 100)),
      earnedAt: is5DayStreak ? 'Unlocked' : undefined
    },
    {
      id: 'badge-5',
      name: 'Polyglot Architect',
      description: 'Solved problems across 3 different programming languages',
      icon: Code2,
      color: 'from-purple-500 to-indigo-500',
      unlocked: isPolyglot,
      progressText: `Languages: ${Math.min(3, langCount)}/3 (${Array.from(uniqueLanguages).slice(0, 3).join(', ') || 'None'})`,
      percent: Math.min(100, Math.round((langCount / 3) * 100)),
      earnedAt: isPolyglot ? 'Unlocked' : undefined
    },
    {
      id: 'badge-6',
      name: 'Kernel Isolation Master',
      description: 'Surpassed 25 isolated Linux hardware sandbox executions',
      icon: ShieldCheck,
      color: 'from-slate-600 to-slate-900',
      unlocked: isMaster,
      progressText: `Evaluations: ${Math.min(25, totalSubs)}/25`,
      percent: Math.min(100, Math.round((totalSubs / 25) * 100)),
      earnedAt: isMaster ? 'Unlocked' : undefined
    }
  ];
}
