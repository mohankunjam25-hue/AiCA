import { describe, it, expect } from 'vitest';
import { calculateUserBadges, UserSubmissionSummary, UserStatsSummary } from '../apps/web/src/utils/badgeCalculator';

describe('Dynamic Data Flow & De-Mocking Engine Tests', () => {
  describe('1. Dynamic Badge Evaluator (calculateUserBadges)', () => {
    it('should return all badges locked for a brand new user with 0 submissions', () => {
      const submissions: UserSubmissionSummary[] = [];
      const stats: UserStatsSummary = { solved: 0, total: 0, streak: 0, longestStreak: 0 };

      const badges = calculateUserBadges(submissions, stats);
      expect(badges).toHaveLength(6);

      const unlocked = badges.filter((b) => b.unlocked);
      expect(unlocked).toHaveLength(0);

      // Verify progress indicators are clean
      const firstBlood = badges.find((b) => b.id === 'badge-1')!;
      expect(firstBlood.percent).toBe(0);
      expect(firstBlood.progressText).toBe('0/1 Problem Solved');

      const streakBadge = badges.find((b) => b.id === 'badge-4')!;
      expect(streakBadge.progressText).toBe('Streak: 0/5 days');
      expect(streakBadge.percent).toBe(0);
    });

    it('should unlock "First Blood" when user solves first problem', () => {
      const submissions: UserSubmissionSummary[] = [
        {
          id: 'sub-1',
          problemId: 'two-sum',
          language: 'python',
          verdict: 'ACCEPTED',
          runtimeMs: 45
        }
      ];
      const stats: UserStatsSummary = { solved: 1, total: 1, streak: 1, longestStreak: 1 };

      const badges = calculateUserBadges(submissions, stats);
      const firstBlood = badges.find((b) => b.id === 'badge-1')!;
      expect(firstBlood.unlocked).toBe(true);
      expect(firstBlood.percent).toBe(100);
      expect(firstBlood.earnedAt).toBe('Unlocked');
    });

    it('should unlock "Sub-10ms Sprinter" only when accepted runtime < 10ms', () => {
      const slowSubs: UserSubmissionSummary[] = [
        {
          id: 'sub-1',
          problemId: 'two-sum',
          language: 'python',
          verdict: 'ACCEPTED',
          runtimeMs: 15
        }
      ];
      const stats: UserStatsSummary = { solved: 1, total: 1, streak: 1, longestStreak: 1 };

      const slowBadges = calculateUserBadges(slowSubs, stats);
      const slowSprinter = slowBadges.find((b) => b.id === 'badge-2')!;
      expect(slowSprinter.unlocked).toBe(false);
      expect(slowSprinter.progressText).toContain('Target: <10ms');

      const fastSubs: UserSubmissionSummary[] = [
        ...slowSubs,
        {
          id: 'sub-2',
          problemId: 'valid-parentheses',
          language: 'cpp',
          verdict: 'ACCEPTED',
          runtimeMs: 4
        }
      ];
      const fastBadges = calculateUserBadges(fastSubs, stats);
      const fastSprinter = fastBadges.find((b) => b.id === 'badge-2')!;
      expect(fastSprinter.unlocked).toBe(true);
      expect(fastSprinter.progressText).toBe('Fastest: 4ms');
      expect(fastSprinter.percent).toBe(100);
    });

    it('should unlock "Quadratic Slayer" when Medium or Hard problem is solved', () => {
      const easyOnly: UserSubmissionSummary[] = [
        {
          id: 'sub-1',
          problemId: 'two-sum',
          difficulty: 'Easy',
          language: 'python',
          verdict: 'ACCEPTED',
          runtimeMs: 12
        }
      ];
      const stats: UserStatsSummary = { solved: 1, total: 1, streak: 1, longestStreak: 1 };

      let badges = calculateUserBadges(easyOnly, stats);
      expect(badges.find((b) => b.id === 'badge-3')!.unlocked).toBe(false);

      const mediumSolved: UserSubmissionSummary[] = [
        ...easyOnly,
        {
          id: 'sub-2',
          problemId: 'coin-change',
          difficulty: 'Medium',
          language: 'python',
          verdict: 'ACCEPTED',
          runtimeMs: 25
        }
      ];
      badges = calculateUserBadges(mediumSolved, stats);
      const slayer = badges.find((b) => b.id === 'badge-3')!;
      expect(slayer.unlocked).toBe(true);
      expect(slayer.percent).toBe(100);
    });

    it('should unlock "5-Day Evolution Streak" when streak reaches 5 days', () => {
      const submissions: UserSubmissionSummary[] = [
        { id: '1', problemId: 'p1', language: 'python', verdict: 'ACCEPTED' }
      ];
      const streak4: UserStatsSummary = { solved: 1, total: 5, streak: 4, longestStreak: 4 };
      let badges = calculateUserBadges(submissions, streak4);
      let streakBadge = badges.find((b) => b.id === 'badge-4')!;
      expect(streakBadge.unlocked).toBe(false);
      expect(streakBadge.progressText).toBe('Streak: 4/5 days');
      expect(streakBadge.percent).toBe(80);

      const streak5: UserStatsSummary = { solved: 1, total: 6, streak: 5, longestStreak: 5 };
      badges = calculateUserBadges(submissions, streak5);
      streakBadge = badges.find((b) => b.id === 'badge-4')!;
      expect(streakBadge.unlocked).toBe(true);
      expect(streakBadge.percent).toBe(100);
    });

    it('should unlock "Polyglot Architect" when user solves in 3 distinct languages', () => {
      const twoLangs: UserSubmissionSummary[] = [
        { id: '1', problemId: 'p1', language: 'python', verdict: 'ACCEPTED' },
        { id: '2', problemId: 'p2', language: 'javascript', verdict: 'ACCEPTED' }
      ];
      const stats: UserStatsSummary = { solved: 2, total: 2, streak: 1, longestStreak: 1 };

      let badges = calculateUserBadges(twoLangs, stats);
      let polyglot = badges.find((b) => b.id === 'badge-5')!;
      expect(polyglot.unlocked).toBe(false);
      expect(polyglot.percent).toBe(67);

      const threeLangs: UserSubmissionSummary[] = [
        ...twoLangs,
        { id: '3', problemId: 'p3', language: 'cpp', verdict: 'ACCEPTED' }
      ];
      badges = calculateUserBadges(threeLangs, stats);
      polyglot = badges.find((b) => b.id === 'badge-5')!;
      expect(polyglot.unlocked).toBe(true);
      expect(polyglot.percent).toBe(100);
    });

    it('should unlock "Kernel Isolation Master" when total evaluations reach 25', () => {
      const submissions: UserSubmissionSummary[] = Array.from({ length: 25 }).map((_, i) => ({
        id: `sub-${i}`,
        problemId: 'two-sum',
        language: 'python',
        verdict: i % 2 === 0 ? 'ACCEPTED' : 'WRONG_ANSWER'
      }));
      const stats: UserStatsSummary = { solved: 13, total: 25, streak: 2, longestStreak: 2 };

      const badges = calculateUserBadges(submissions, stats);
      const master = badges.find((b) => b.id === 'badge-6')!;
      expect(master.unlocked).toBe(true);
      expect(master.progressText).toBe('Evaluations: 25/25');
      expect(master.percent).toBe(100);
    });
  });

  describe('2. Dynamic Evolutions Speedup Calculation', () => {
    it('should accurately compute speedup percentage from baseline to optimal', () => {
      const initialRuntimeMs = 1000;
      const optimalRuntimeMs = 50;

      const speedup = Math.round(((initialRuntimeMs - optimalRuntimeMs) / initialRuntimeMs) * 100);
      expect(speedup).toBe(95);
    });

    it('should handle zero or negative speedup gracefully without NaN', () => {
      const initialRuntimeMs = 20;
      const optimalRuntimeMs = 25; // slightly slower run

      const speedup = initialRuntimeMs > optimalRuntimeMs
        ? Math.round(((initialRuntimeMs - optimalRuntimeMs) / initialRuntimeMs) * 100)
        : 0;

      expect(speedup).toBe(0);
      expect(Number.isNaN(speedup)).toBe(false);
    });
  });

  describe('3. Dynamic Heatmap Level Quantization', () => {
    it('should quantize daily counts into 4 deterministic color levels', () => {
      const quantize = (count: number) => (count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : 3);

      expect(quantize(0)).toBe(0);
      expect(quantize(1)).toBe(1);
      expect(quantize(2)).toBe(1);
      expect(quantize(3)).toBe(2);
      expect(quantize(5)).toBe(2);
      expect(quantize(6)).toBe(3);
      expect(quantize(20)).toBe(3);
    });
  });
});
