import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame,
  Zap,
  Code2,
  Trophy,
  ArrowRight,
  BookOpen,
  Sparkles,
  Workflow,
  Clock,
  CheckCircle2,
  Layers,
  Terminal,
  Activity,
  Play,
  ArrowUpRight,
  ChevronRight,
  Award
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useDataCacheStore } from '../store/useDataCacheStore';
import { api } from '../services/api';
import { useIsMobile, useCatalogSummary, useUserProgressSummary } from '../hooks';

const MobileHomeView = React.lazy(() =>
  import('../components/mobile/MobileHomeView').then((m) => ({ default: m.MobileHomeView }))
);

interface ProblemSummary {
  id: string;
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  description?: string;
  totalSubmissions?: number;
  acceptanceRate?: number | null;
}

interface HomeFeedCacheData {
  problems: ProblemSummary[];
  dailyProblem: ProblemSummary | null;
  lastActive: { id: string; title: string; language: string } | null;
}

export function DeveloperHomePage() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { summary: catalogSummary } = useCatalogSummary();
  const { progress: userProgress } = useUserProgressSummary(isAuthenticated);

  const cacheKey = `home_feed_${user?.id || 'anon'}`;
  const initialCache = useDataCacheStore.getState().get<HomeFeedCacheData>(cacheKey);

  const [problems, setProblems] = useState<ProblemSummary[]>(initialCache?.problems || []);
  const [dailyProblem, setDailyProblem] = useState<ProblemSummary | null>(initialCache?.dailyProblem || null);
  const [lastActive, setLastActive] = useState<{ id: string; title: string; language: string } | null>(
    initialCache?.lastActive || null
  );
  const [loading, setLoading] = useState(!initialCache);

  // Dynamic Time-of-Day Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Today's Formatted Date
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Detect last active problem from localStorage
    const savedLastId = localStorage.getItem('last_active_problem');

    const fetchFeed = async () => {
      try {
        const res = await api.get('/problems?page=1&limit=8&sortBy=latest');
        const list: ProblemSummary[] = res.data?.data?.problems || [];

        if (isMounted) {
          setProblems(list);

          // Select Problem of the Day deterministically based on day of year
          if (list.length > 0) {
            const dayOfYear = Math.floor(
              (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
            );
            const potd = list[dayOfYear % list.length];
            setDailyProblem(potd);
          }

          // Match last active problem metadata if exists
          let resolvedLastActive: { id: string; title: string; language: string } | null = null;
          if (savedLastId) {
            const matched = list.find((p) => p.slug === savedLastId || p.id === savedLastId);
            resolvedLastActive = {
              id: savedLastId,
              title: matched ? matched.title : 'Recent Problem Workspace',
              language: 'Python'
            };
            setLastActive(resolvedLastActive);
          }

          useDataCacheStore.getState().set<HomeFeedCacheData>(cacheKey, {
            problems: list,
            dailyProblem: list.length > 0 ? list[0] : null,
            lastActive: resolvedLastActive
          });
        }
      } catch (err: any) {
        console.warn('[DeveloperHomePage] Failed to fetch feed:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFeed();

    return () => {
      isMounted = false;
    };
  }, [cacheKey]);

  // Real dynamic metrics (never fall back to fake sample numbers)
  const resolvedStreak = userProgress?.currentStreak ?? profile?.currentStreak ?? 0;
  const resolvedSolved = userProgress?.problemsSolved ?? profile?.problemsSolved ?? 0;
  const resolvedSubmissions = userProgress?.totalSubmissions ?? profile?.totalSubmissions ?? 0;
  const solvedToday = userProgress?.solvedToday ?? false;
  const totalCatalog = catalogSummary?.totalProblems ?? problems.length;

  const currentPOTD: ProblemSummary | null =
    catalogSummary?.dailyChallenge || dailyProblem || problems[0] || null;
  const spotlightProblems: ProblemSummary[] =
    (catalogSummary?.spotlights && catalogSummary.spotlights.length > 0
      ? catalogSummary.spotlights
      : problems.slice(0, 2));

  const getDifficultyBadge = (diff: string) => {
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

  if (isMobile) {
    return (
      <Suspense fallback={null}>
        <MobileHomeView
          greeting={greeting}
          userName={profile?.fullName || user?.username || 'Engineer'}
          streak={resolvedStreak}
          problemsSolved={resolvedSolved}
          totalSubmissions={resolvedSubmissions}
          currentPOTD={currentPOTD}
          lastActive={lastActive}
          problems={problems}
          spotlights={spotlightProblems}
        />
      </Suspense>
    );
  }

  return (
    <div className="flex-1 bg-[#f6f8fa] dark:bg-[#010409] text-[#1f2328] dark:text-[#e6edf3] pb-16 transition-colors duration-200">
      {/* ================================================================== */}
      {/* 1. TOP GREETING & DEVELOPER FOCUS RIBBON                           */}
      {/* ================================================================== */}
      <div className="bg-white dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d] py-6 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-[#0969da] dark:text-[#58a6ff] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Developer Daily Hub &bull; {todayFormatted}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1f2328] dark:text-[#f0f6fc] mt-1">
                {greeting}, {profile?.fullName || user?.username || 'Engineer'}! 👋
              </h1>
              <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-1">
                Ready to solve today&apos;s daily algorithmic challenge and keep your isolated execution streak active.
              </p>
            </div>

            {/* Quick Action Pills */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <Link
                to={currentPOTD ? `/workspace/${currentPOTD.slug || currentPOTD.id}` : '/problems'}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                {currentPOTD ? 'Solve Daily Challenge' : 'Browse Problems'}
              </Link>
              <Link
                to="/dashboard"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] shadow-2xs transition flex items-center gap-1.5"
              >
                <Trophy className="w-3.5 h-3.5 text-[#9a6700] dark:text-[#d29922]" />
                View Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* ================================================================ */}
        {/* 2. DUAL HERO GRID: PROBLEM OF THE DAY + DAILY STREAK CARD        */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Problem of the Day (8 Cols) */}
          <div className="lg:col-span-8 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] p-6 shadow-xs flex flex-col justify-between relative overflow-hidden group">
            {/* Ambient Background Gradient Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#0969da]/10 via-transparent to-transparent pointer-events-none" />

            {currentPOTD ? (
              <>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0969da] dark:text-[#58a6ff] bg-[#0969da]/10 dark:bg-[#58a6ff]/15 px-2.5 py-1 rounded-md border border-[#0969da]/20 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Official Problem of the Day
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getDifficultyBadge(currentPOTD.difficulty)}`}>
                      {currentPOTD.difficulty}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#1f2328] dark:text-[#f0f6fc] group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff] transition">
                      {currentPOTD.title}
                    </h2>
                    <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-1.5 leading-relaxed max-w-2xl line-clamp-2">
                      {currentPOTD.description || 'Solve today’s selected algorithmic challenge inside the isolated execution workspace.'}
                    </p>
                  </div>

                  {/* Tags and Benchmarks */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    {currentPOTD.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-[#f6f8fa] dark:bg-[#21262d] text-[#57606a] dark:text-[#8b949e] border border-[#d0d7de] dark:border-[#30363d] font-mono text-[11px]"
                      >
                        #{tag}
                      </span>
                    ))}
                    <span className="text-[#8c959f] dark:text-[#6e7681] text-xs font-mono ml-auto">
                      Acceptance: {currentPOTD.acceptanceRate != null ? `${currentPOTD.acceptanceRate}%` : '--'}
                    </span>
                  </div>
                </div>

                {/* POTD Launch Bar */}
                <div className="pt-6 mt-4 border-t border-[#d0d7de] dark:border-[#30363d] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-[#57606a] dark:text-[#8b949e] font-mono">
                    <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{currentPOTD.totalSubmissions ?? 0} total submissions</span>
                  </div>

                  <Link
                    to={`/workspace/${currentPOTD.slug || currentPOTD.id}`}
                    className="px-5 py-2 rounded-lg text-xs font-bold bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] text-white shadow-xs transition flex items-center gap-2 cursor-pointer"
                  >
                    <span>Launch in Interactive Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="py-8 text-center space-y-2">
                <Sparkles className="w-6 h-6 text-[#0969da] mx-auto" />
                <h2 className="text-base font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                  {loading ? 'Loading Problem of the Day...' : 'Explore Problem Catalog'}
                </h2>
                <p className="text-xs text-[#57606a] dark:text-[#8b949e]">
                  {loading ? 'Fetching today’s selected challenge from server.' : 'Open the problem hub to pick your next challenge.'}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Active Streak Card (4 Cols) */}
          <div className="lg:col-span-4 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-[#57606a] dark:text-[#8b949e] mb-3">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className={`w-4 h-4 ${resolvedStreak > 0 ? 'text-rose-500 animate-pulse' : 'text-[#8c959f]'}`} />
                  Consecutive Streak
                </span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                    resolvedStreak > 0
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97] border-[#d0d7de] dark:border-[#30363d]'
                  }`}
                >
                  {resolvedStreak > 0 ? 'Active' : 'Start Today'}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#1f2328] dark:text-[#f0f6fc] font-mono">
                  {resolvedStreak}
                </span>
                <span className="text-sm font-semibold text-[#57606a] dark:text-[#8b949e]">Days Active</span>
              </div>

              <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-2 leading-relaxed">
                {solvedToday
                  ? `Great work! You have an accepted submission today (${resolvedSolved} solved total).`
                  : `Submit an accepted pass today to reach a ${resolvedStreak + 1}-day streak!`}
              </p>
            </div>

            {/* Streak Progress Indicator */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-[11px] font-semibold text-[#57606a] dark:text-[#8b949e]">
                <span>Today&apos;s Milestone</span>
                <span className={solvedToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#656d76] dark:text-[#848d97]'}>
                  {solvedToday ? 'Completed Today' : 'Ready to Submit'}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[#f6f8fa] dark:bg-[#21262d] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500"
                  style={{ width: solvedToday ? '100%' : '0%' }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#d0d7de] dark:border-[#30363d]">
              <Link
                to="/leaderboard"
                className="text-xs font-semibold text-[#0969da] dark:text-[#58a6ff] hover:underline flex items-center justify-between"
              >
                <span>Check Global Streak Standings</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 3. SESSION CONTINUITY: RESUME CODING (LAST ACTIVE DRAFT)          */}
        {/* ================================================================ */}
        {lastActive && (
          <div className="p-4 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-[#0969da]/10 dark:bg-[#58a6ff]/15 text-[#0969da] dark:text-[#58a6ff] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                    Resume where you left off
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#f6f8fa] dark:bg-[#21262d] text-[#57606a] dark:text-[#8b949e] border border-[#d0d7de] dark:border-[#30363d]">
                    Saved Draft
                  </span>
                </div>
                <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-0.5">
                  Continue solving <strong className="text-[#1f2328] dark:text-[#f0f6fc]">{lastActive.title}</strong> in the code workspace.
                </p>
              </div>
            </div>

            <Link
              to={`/workspace/${lastActive.id}`}
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition flex items-center justify-center gap-1.5 shrink-0"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Resume Coding</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* ================================================================ */}
        {/* 4. CURATED ALGORITHMIC SPOTLIGHTS                                 */}
        {/* ================================================================ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Curated Algorithmic Spotlights
            </h3>
            <span className="text-xs text-[#57606a] dark:text-[#8b949e]">
              Selected optimization challenges
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {spotlightProblems.slice(0, 2).map((spot) => (
              <div
                key={spot.id || spot.slug}
                className="p-5 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#8c959f] dark:hover:border-[#6e7681] transition group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0969da] dark:text-[#58a6ff] bg-[#0969da]/10 dark:bg-[#58a6ff]/15 border border-[#0969da]/20 px-2 py-0.5 rounded">
                      {spot.tags[0] || 'Featured'}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getDifficultyBadge(spot.difficulty)}`}>
                      {spot.difficulty}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff] transition">
                    {spot.title}
                  </h4>
                  <p className="text-xs text-[#57606a] dark:text-[#8b949e] leading-relaxed line-clamp-2">
                    {spot.description || 'Implement an optimal solution under isolated sandbox constraints.'}
                  </p>
                </div>

                <Link
                  to={`/workspace/${spot.slug || spot.id}`}
                  className="text-xs font-semibold text-[#0969da] dark:text-[#58a6ff] hover:underline flex items-center gap-1 pt-2 border-t border-[#d0d7de]/60 dark:border-[#30363d]"
                >
                  <span>Solve in Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}

            {/* Spotlight 3: Algorithm Visualizer Guide */}
            <div className="p-5 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs flex flex-col justify-between space-y-4 hover:border-[#8c959f] dark:hover:border-[#6e7681] transition group">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded">
                    Interactive Walkthrough
                  </span>
                  <Workflow className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <h4 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff] transition">
                  Algorithm Visualizer
                </h4>
                <p className="text-xs text-[#57606a] dark:text-[#8b949e] leading-relaxed">
                  Trace dynamic step-by-step state animations across arrays, sliding windows, and binary searches.
                </p>
              </div>

              <Link
                to="/algorithms"
                className="text-xs font-semibold text-[#0969da] dark:text-[#58a6ff] hover:underline flex items-center gap-1 pt-2 border-t border-[#d0d7de]/60 dark:border-[#30363d]"
              >
                <span>Open Visualizer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 5. TOP CATALOG CHALLENGES FOR TODAY                               */}
        {/* ================================================================ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#1a7f37] dark:text-[#3fb950]" />
              Top Challenges for Today
            </h3>
            <Link
              to="/problems"
              className="text-xs font-semibold text-[#0969da] dark:text-[#58a6ff] hover:underline flex items-center gap-1"
            >
              <span>Explore All Problems ({totalCatalog})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="border border-[#d0d7de] dark:border-[#30363d] rounded-xl overflow-hidden bg-white dark:bg-[#161b22] divide-y divide-[#d0d7de] dark:divide-[#30363d] shadow-xs">
            {problems.slice(0, 5).map((prob) => (
              <div
                key={prob.id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${getDifficultyBadge(prob.difficulty)}`}>
                    {prob.difficulty}
                  </span>
                  <Link
                    to={`/workspace/${prob.slug || prob.id}`}
                    className="font-semibold text-xs text-[#1f2328] dark:text-[#f0f6fc] hover:text-[#0969da] dark:hover:text-[#58a6ff] truncate transition"
                  >
                    {prob.title}
                  </Link>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#57606a] dark:text-[#8b949e]">
                    {prob.tags.slice(0, 2).map((t) => (
                      <span key={t} className="px-1.5 py-0.2 rounded bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d]">
                        {t}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={`/workspace/${prob.slug || prob.id}`}
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] hover:border-[#0969da] dark:hover:border-[#58a6ff] transition"
                  >
                    Solve
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
