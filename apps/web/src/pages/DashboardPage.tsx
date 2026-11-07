import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Flame,
  Code2,
  Trophy,
  ArrowRight,
  User as UserIcon,
  Sparkles,
  Layers,
  History,
  TrendingUp,
  GitCommit,
  ExternalLink,
  Loader2,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useDataCacheStore } from '../store/useDataCacheStore';
import { api } from '../services/api';

interface SubmissionItem {
  id: string;
  problemId: string;
  problemTitle: string;
  language: string;
  verdict: string;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  compositeScore?: number;
  createdAt: string;
}

interface CatalogProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  totalSubmissions?: number;
  acceptanceRate?: number;
}

interface DashboardCacheData {
  submissions: SubmissionItem[];
  catalogProblems: CatalogProblem[];
  activityMap: Record<string, number>;
  stats: {
    solved: number;
    total: number;
    streak: number;
    longestStreak: number;
  };
}

export function DashboardPage() {
  const { user, profile } = useAuthStore();
  const cacheKey = `dashboard_data_${user?.id || 'anon'}`;
  const initialCache = useDataCacheStore.getState().get<DashboardCacheData>(cacheKey);

  const [submissions, setSubmissions] = useState<SubmissionItem[]>(initialCache?.submissions || []);
  const [catalogProblems, setCatalogProblems] = useState<CatalogProblem[]>(initialCache?.catalogProblems || []);
  const [activityMap, setActivityMap] = useState<Record<string, number>>(initialCache?.activityMap || {});
  const [stats, setStats] = useState(
    initialCache?.stats || {
      solved: profile?.problemsSolved || 0,
      total: profile?.totalSubmissions || 0,
      streak: profile?.currentStreak || 0,
      longestStreak: 0
    }
  );
  // Instant render without loader if cache exists
  const [loading, setLoading] = useState(!initialCache);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      // If we already have fresh cached data, avoid redundant network requests
      const freshCache = useDataCacheStore.getState().get<DashboardCacheData>(cacheKey, 60 * 1000);
      if (freshCache && submissions.length > 0) {
        setLoading(false);
        return;
      }

      try {
        const [subRes, heatRes, probRes] = await Promise.allSettled([
          api.get('/submissions/my?limit=8'),
          api.get('/submissions/activity-heatmap'),
          api.get('/problems?page=1&limit=15&sortBy=latest')
        ]);

        if (isMounted) {
          let updatedSubs = submissions;
          let updatedProblems = catalogProblems;
          let updatedMap = activityMap;
          let updatedStats = stats;

          if (subRes.status === 'fulfilled' && subRes.value.data?.data?.submissions) {
            updatedSubs = subRes.value.data.data.submissions;
            setSubmissions(updatedSubs);
          }
          if (heatRes.status === 'fulfilled' && heatRes.value.data?.data) {
            const h = heatRes.value.data.data;
            updatedStats = {
              solved: h.problemsSolved ?? profile?.problemsSolved ?? 0,
              total: h.totalSubmissions ?? profile?.totalSubmissions ?? 0,
              streak: h.currentStreak ?? profile?.currentStreak ?? 0,
              longestStreak: h.longestStreak ?? 0
            };
            setStats(updatedStats);
            if (h.activityByDate) {
              updatedMap = h.activityByDate;
              setActivityMap(updatedMap);
            }
          }
          if (probRes.status === 'fulfilled' && probRes.value.data?.data?.problems) {
            updatedProblems = probRes.value.data.data.problems;
            setCatalogProblems(updatedProblems);
          }

          // Save fresh snapshot to in-memory cache
          useDataCacheStore.getState().set<DashboardCacheData>(cacheKey, {
            submissions: updatedSubs,
            catalogProblems: updatedProblems,
            activityMap: updatedMap,
            stats: updatedStats
          });
        }
      } catch (err) {
        console.warn('[Dashboard] Could not load live metrics:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, [cacheKey, profile]);

  // Generate 15-week (105 days) GitHub style contribution punchcard
  const { contributionDays, totalPeriodActivity } = useMemo(() => {
    const days: { date: string; count: number; dayOfWeek: number }[] = [];
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const daysToAdd = 6 - currentDayOfWeek;
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + daysToAdd);

    const totalDays = 15 * 7; // 15 columns of 7 days
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (totalDays - 1));

    let totalCount = 0;
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const count = activityMap[dateStr] || 0;
      totalCount += count;
      days.push({
        date: dateStr,
        count,
        dayOfWeek: d.getDay()
      });
    }

    return { contributionDays: days, totalPeriodActivity: totalCount };
  }, [activityMap]);

  // GitHub contribution square color generator
  const getCellColor = (count: number) => {
    if (count === 0) {
      return 'bg-[#ebedf0] dark:bg-[#161b22] border border-[#d0d7de]/40 dark:border-[#30363d]/60';
    }
    if (count <= 2) {
      return 'bg-[#9be9a8] dark:bg-[#0e4429] border border-[#4ac26b]/40 dark:border-[#006d32]/40';
    }
    if (count <= 4) {
      return 'bg-[#40c463] dark:bg-[#006d32] border border-[#2ea043]/40 dark:border-[#26a641]/40';
    }
    if (count <= 6) {
      return 'bg-[#30a14e] dark:bg-[#26a641] border border-[#238636]/40 dark:border-[#39d353]/40';
    }
    return 'bg-[#216e39] dark:bg-[#39d353] border border-[#1a7f37]/40 dark:border-[#56d364]/40';
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return 'text-[#1a7f37] dark:text-[#3fb950] bg-[#dafbe1] dark:bg-[#2ea04326] border-[#4ac26b66] dark:border-[#2ea0434d]';
      case 'MEDIUM':
        return 'text-[#9a6700] dark:text-[#d29922] bg-[#fff8c5] dark:bg-[#bb800926] border-[#d4a72c66] dark:border-[#bb80094d]';
      case 'HARD':
        return 'text-[#cf222e] dark:text-[#f85149] bg-[#ffebe9] dark:bg-[#f8514926] border-[#ff818266] dark:border-[#f851494d]';
      default:
        return 'text-[#57606a] dark:text-[#8b949e] bg-[#f6f8fa] dark:bg-[#21262d] border-[#d0d7de] dark:border-[#30363d]';
    }
  };

  const getDifficultyDot = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return 'bg-[#2ea043]';
      case 'MEDIUM':
        return 'bg-[#bb8009]';
      case 'HARD':
        return 'bg-[#f85149]';
      default:
        return 'bg-[#8b949e]';
    }
  };

  // Identify recommended challenges: catalog problems not yet accepted
  const acceptedProblemTitles = new Set(
    submissions.filter((s) => s.verdict === 'ACCEPTED').map((s) => s.problemTitle)
  );

  const recommendedChallenges = catalogProblems
    .filter((p) => !acceptedProblemTitles.has(p.title))
    .slice(0, 3);

  // Compute accuracy rate
  const acceptedCount = submissions.filter((s) => s.verdict === 'ACCEPTED').length;
  const accuracyRate = stats.total > 0 ? Math.round((acceptedCount / stats.total) * 100) : 0;
  const catalogTotal = catalogProblems.length || 8;
  const completionPercentage = Math.round((stats.solved / catalogTotal) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Header Strip: Clean Profile Bar (Zero Black Gimmick Banner) */}
      <div className="p-4 sm:p-5 rounded-md bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* User Identity */}
        <div className="flex items-center gap-3.5">
          <div className="relative shrink-0">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={user?.username}
                className="w-12 h-12 rounded-full object-cover border border-[#d0d7de] dark:border-[#30363d]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-[#0969da] dark:text-[#58a6ff]" />
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#2ea043] ring-2 ring-white dark:ring-[#161b22]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-[#1f2328] dark:text-[#f0f6fc] tracking-tight">
                {profile?.fullName || user?.username || 'Developer'}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#dafbe1] dark:bg-[#2ea04326] text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b66] dark:border-[#2ea0434d] font-semibold">
                GV2 {user?.role || 'STUDENT'}
              </span>
            </div>
            <p className="text-xs text-[#57606a] dark:text-[#8b949e] font-mono mt-0.5">
              @{user?.username || 'student'} &bull; Real-time algorithmic performance & code evaluation workspace
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/profile"
            className="px-3 py-1.5 rounded-md text-xs font-semibold border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition"
          >
            Profile Settings
          </Link>
          <Link
            to="/problems"
            className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#1f883d] dark:bg-[#238636] hover:bg-[#1a7f37] dark:hover:bg-[#2ea043] text-white shadow-xs transition flex items-center gap-1.5"
          >
            Solve Next Problem
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Row: 4 Compact GitHub Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Tile 1: Solved */}
        <div className="p-4 rounded-md bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#57606a] dark:text-[#8b949e]">
            <span className="text-xs font-bold uppercase tracking-wider">Problems Solved</span>
            <CheckCircle2 className="w-4 h-4 text-[#1a7f37] dark:text-[#3fb950]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#1f2328] dark:text-[#f0f6fc]">
              {stats.solved}
            </span>
            <span className="text-xs text-[#57606a] dark:text-[#8b949e] font-mono">
              / {catalogTotal} challenges
            </span>
          </div>
          <div className="w-full bg-[#eaeef2] dark:bg-[#21262d] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#2ea043] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, completionPercentage))}%` }}
            />
          </div>
        </div>

        {/* Tile 2: Executions */}
        <div className="p-4 rounded-md bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#57606a] dark:text-[#8b949e]">
            <span className="text-xs font-bold uppercase tracking-wider">Sandbox Runs</span>
            <Code2 className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#1f2328] dark:text-[#f0f6fc]">
              {stats.total}
            </span>
            <span className="text-xs text-[#57606a] dark:text-[#8b949e] font-mono">
              evaluations
            </span>
          </div>
          <p className="text-[11px] text-[#57606a] dark:text-[#8b949e] truncate font-mono">
            Linux Kernel Ephemeral Sandbox
          </p>
        </div>

        {/* Tile 3: Streak */}
        <div className="p-4 rounded-md bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#57606a] dark:text-[#8b949e]">
            <span className="text-xs font-bold uppercase tracking-wider">Active Streak</span>
            <Flame className="w-4 h-4 text-[#d29922]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#1f2328] dark:text-[#f0f6fc]">
              {stats.streak}
            </span>
            <span className="text-xs text-[#57606a] dark:text-[#8b949e] font-mono">
              Days active
            </span>
          </div>
          <p className="text-[11px] text-[#57606a] dark:text-[#8b949e] font-mono">
            Best Record: {stats.longestStreak} Days
          </p>
        </div>

        {/* Tile 4: Accuracy */}
        <div className="p-4 rounded-md bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#57606a] dark:text-[#8b949e]">
            <span className="text-xs font-bold uppercase tracking-wider">Acceptance Rate</span>
            <Trophy className="w-4 h-4 text-[#9a6700] dark:text-[#d29922]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#1f2328] dark:text-[#f0f6fc]">
              {accuracyRate}%
            </span>
            <span className="text-xs text-[#57606a] dark:text-[#8b949e] font-mono">
              {acceptedCount} accepted
            </span>
          </div>
          <p className="text-[11px] text-[#57606a] dark:text-[#8b949e] font-mono">
            Deterministic AST Validated
          </p>
        </div>
      </div>

      {/* 3. Main Two-Column Layout (Left 65% / Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* A. GitHub Style Contribution Heatmap Card */}
          <div className="p-4 sm:p-5 rounded-md bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff]" />
                <h2 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                  Code Activity & Submission Punchcard
                </h2>
              </div>
              <span className="text-xs font-mono text-[#57606a] dark:text-[#8b949e]">
                {totalPeriodActivity} runs in last 15 weeks
              </span>
            </div>

            {/* Contribution Squares Grid */}
            <div className="overflow-x-auto pb-1 pt-2">
              <div className="inline-grid grid-rows-7 grid-flow-col gap-1 min-w-[500px]">
                {contributionDays.map((d) => (
                  <div
                    key={d.date}
                    className={`w-3.5 h-3.5 rounded-xs transition-colors cursor-pointer ${getCellColor(
                      d.count
                    )}`}
                    title={`${d.count} submission${d.count === 1 ? '' : 's'} on ${new Date(
                      d.date
                    ).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}`}
                  />
                ))}
              </div>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center justify-between pt-2 border-t border-[#d0d7de]/60 dark:border-[#30363d]/60 text-[11px] text-[#57606a] dark:text-[#8b949e]">
              <span>Daily execution density</span>
              <div className="flex items-center gap-1.5">
                <span>Less</span>
                <span className="w-3 h-3 rounded-xs bg-[#ebedf0] dark:bg-[#161b22] border border-[#d0d7de]/40 dark:border-[#30363d]/60" />
                <span className="w-3 h-3 rounded-xs bg-[#9be9a8] dark:bg-[#0e4429]" />
                <span className="w-3 h-3 rounded-xs bg-[#40c463] dark:bg-[#006d32]" />
                <span className="w-3 h-3 rounded-xs bg-[#30a14e] dark:bg-[#26a641]" />
                <span className="w-3 h-3 rounded-xs bg-[#216e39] dark:bg-[#39d353]" />
                <span>More</span>
              </div>
            </div>
          </div>

          {/* B. Recent Submissions: Flush GitHub Commit-List Style */}
          <div className="rounded-md bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-2xs overflow-hidden">
            <div className="p-3.5 sm:p-4 border-b border-[#d0d7de] dark:border-[#30363d] flex items-center justify-between bg-[#f6f8fa] dark:bg-[#161b22]">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#57606a] dark:text-[#8b949e]" />
                <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                  Recent Submission History
                </h3>
              </div>
              <Link
                to="/profile"
                className="text-xs font-semibold text-[#0969da] dark:text-[#58a6ff] hover:underline flex items-center gap-1"
              >
                Complete History
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-[#57606a] dark:text-[#8b949e]">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-xs font-mono">Syncing submissions...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <Code2 className="w-8 h-8 text-[#8c959f] mx-auto" />
                <h4 className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                  No Submissions Recorded Yet
                </h4>
                <p className="text-xs text-[#57606a] dark:text-[#8b949e] max-w-sm mx-auto">
                  Pick a problem from the catalog to run your first benchmark.
                </p>
                <div className="pt-2">
                  <Link
                    to="/problems"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1f883d] dark:bg-[#238636] text-white text-xs font-semibold hover:bg-[#1a7f37] dark:hover:bg-[#2ea043] transition"
                  >
                    Browse Catalog
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#d0d7de] dark:divide-[#30363d]">
                {submissions.map((sub) => {
                  const isAccepted = sub.verdict === 'ACCEPTED';
                  const formattedDate = new Date(sub.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={sub.id}
                      className="p-3 sm:px-4 sm:py-3 flex items-center justify-between text-xs hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]/50 transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-3">
                        {isAccepted ? (
                          <CheckCircle2 className="w-4 h-4 text-[#1a7f37] dark:text-[#3fb950] shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#cf222e] dark:text-[#f85149] shrink-0" />
                        )}
                        <div className="min-w-0">
                          <Link
                            to={`/workspace/${sub.problemId}`}
                            className="font-semibold text-xs text-[#1f2328] dark:text-[#f0f6fc] hover:text-[#0969da] dark:hover:text-[#58a6ff] transition truncate block"
                          >
                            {sub.problemTitle}
                          </Link>
                          <div className="flex items-center gap-2 text-[#57606a] dark:text-[#8b949e] font-mono text-[10px] mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] font-semibold">
                              {sub.language}
                            </span>
                            <span>&bull;</span>
                            <span>{formattedDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-right shrink-0 font-mono">
                        <div className="hidden sm:block">
                          <span className="text-[#1f2328] dark:text-[#e6edf3] font-bold block text-xs">
                            {sub.executionTimeMs != null ? `${sub.executionTimeMs}ms` : '--'}
                          </span>
                          <span className="text-[#57606a] dark:text-[#8b949e] text-[10px]">
                            {sub.memoryUsedKb != null
                              ? `${Math.round(sub.memoryUsedKb / 1024)}MB`
                              : '--'}
                          </span>
                        </div>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-full text-[10px] border ${
                            isAccepted
                              ? 'text-[#1a7f37] dark:text-[#3fb950] bg-[#dafbe1] dark:bg-[#2ea04326] border-[#4ac26b66] dark:border-[#2ea0434d]'
                              : 'text-[#cf222e] dark:text-[#f85149] bg-[#ffebe9] dark:bg-[#f8514926] border-[#ff818266] dark:border-[#f851494d]'
                          }`}
                        >
                          {sub.verdict}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Span 1) */}
        <div className="space-y-6">
          {/* C. Recommended Challenges */}
          <div className="rounded-md bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-2xs overflow-hidden">
            <div className="p-3.5 border-b border-[#d0d7de] dark:border-[#30363d] flex items-center justify-between bg-[#f6f8fa] dark:bg-[#161b22]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#9a6700] dark:text-[#d29922]" />
                <h3 className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] uppercase tracking-wider">
                  Recommended Challenges
                </h3>
              </div>
            </div>

            <div className="p-3 space-y-2.5">
              {recommendedChallenges.length === 0 ? (
                <div className="text-xs text-[#57606a] dark:text-[#8b949e] py-3 text-center">
                  All catalog challenges completed!
                </div>
              ) : (
                recommendedChallenges.map((prob) => (
                  <div
                    key={prob.id || prob.slug}
                    className="p-3 rounded-md bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${getDifficultyDot(
                            prob.difficulty
                          )}`}
                        />
                        <span className="font-bold text-xs text-[#1f2328] dark:text-[#f0f6fc] truncate">
                          {prob.title}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${getDifficultyColor(
                          prob.difficulty
                        )}`}
                      >
                        {prob.difficulty}
                      </span>
                    </div>

                    {prob.tags && prob.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {prob.tags.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-[#57606a] dark:text-[#8b949e]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <Link
                      to={`/workspace/${prob.slug}`}
                      className="w-full flex items-center justify-center gap-1.5 py-1 text-center rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] text-[#1f2328] dark:text-[#f0f6fc] text-xs font-semibold transition"
                    >
                      Solve Challenge
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* D. Topic Mastery Breakdown */}
          <div className="p-4 rounded-md bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff]" />
              <h3 className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] uppercase tracking-wider">
                Topic Mastery
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between text-[#57606a] dark:text-[#8b949e] font-mono mb-1">
                  <span>Arrays & Hashing</span>
                  <span>75%</span>
                </div>
                <div className="w-full bg-[#eaeef2] dark:bg-[#21262d] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#2ea043] h-full rounded-full w-3/4" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[#57606a] dark:text-[#8b949e] font-mono mb-1">
                  <span>Two Pointers & Sliding Window</span>
                  <span>50%</span>
                </div>
                <div className="w-full bg-[#eaeef2] dark:bg-[#21262d] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#0969da] h-full rounded-full w-1/2" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[#57606a] dark:text-[#8b949e] font-mono mb-1">
                  <span>Dynamic Programming</span>
                  <span>25%</span>
                </div>
                <div className="w-full bg-[#eaeef2] dark:bg-[#21262d] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#bb8009] h-full rounded-full w-1/4" />
                </div>
              </div>
            </div>
          </div>

          {/* E. Quick Platform Jump */}
          <div className="p-3.5 rounded-md bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] space-y-2 text-xs">
            <span className="font-bold text-[#57606a] dark:text-[#8b949e] text-[10px] uppercase tracking-wider">
              Quick Shortcuts
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to="/algorithms"
                className="p-2 rounded-md bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] hover:border-[#0969da] dark:hover:border-[#58a6ff] transition font-semibold text-[#1f2328] dark:text-[#f0f6fc] flex items-center justify-between"
              >
                <span>Visualizer</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#57606a] dark:text-[#8b949e]" />
              </Link>
              <Link
                to="/leaderboard"
                className="p-2 rounded-md bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] hover:border-[#0969da] dark:hover:border-[#58a6ff] transition font-semibold text-[#1f2328] dark:text-[#f0f6fc] flex items-center justify-between"
              >
                <span>Rankings</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#57606a] dark:text-[#8b949e]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default DashboardPage;
