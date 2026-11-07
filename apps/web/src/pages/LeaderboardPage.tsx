import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Globe,
  Flame,
  CheckCircle2,
  Clock,
  User as UserIcon,
  Loader2,
  Search,
  ArrowDown,
  Sparkles,
  ChevronDown,
  Award,
  Layers,
  ArrowRight
} from 'lucide-react';
import { LeaderboardEntry, GlobalLeaderboardEntry, ProblemDifficulty } from '@aica/shared';
import { LeaderboardView } from '../components/LeaderboardView';
import { LeaderboardPodium, PodiumEntry } from '../components/LeaderboardPodium';
import { api } from '../services/api';
import { useDataCacheStore } from '../store/useDataCacheStore';
import { useAuthStore } from '../store/useAuthStore';

interface ProblemItem {
  id: string;
  title: string;
  slug?: string;
  difficulty?: ProblemDifficulty;
}

export function LeaderboardPage() {
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  const [activeTab, setActiveTab] = useState<'global' | 'problem'>('global');
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<string>('');

  const cachedGlobal = useDataCacheStore.getState().get<GlobalLeaderboardEntry[]>('leaderboard_global');
  const [globalRankings, setGlobalRankings] = useState<GlobalLeaderboardEntry[]>(cachedGlobal || []);
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(!cachedGlobal);

  // Global search input
  const [globalSearch, setGlobalSearch] = useState('');

  // Fetch catalog problems on mount
  useEffect(() => {
    const loadProblems = async () => {
      const cachedCatalog = useDataCacheStore.getState().get<ProblemItem[]>('leaderboard_catalog_problems');
      if (cachedCatalog && cachedCatalog.length > 0) {
        setProblems(cachedCatalog);
        if (!selectedProblem) setSelectedProblem(cachedCatalog[0].id);
        return;
      }

      try {
        const res = await api.get('/problems');
        const list = res.data?.data?.problems || [];
        if (list.length > 0) {
          setProblems(list);
          useDataCacheStore.getState().set('leaderboard_catalog_problems', list);
          if (!selectedProblem) setSelectedProblem(list[0].id);
        }
      } catch (err: any) {
        console.warn('[LeaderboardPage] Failed to fetch catalog:', err.message);
      }
    };
    loadProblems();
  }, []);

  const fetchGlobalLeaderboard = async (force: boolean = false) => {
    const cached = useDataCacheStore.getState().get<GlobalLeaderboardEntry[]>('leaderboard_global');
    if (cached && !force) {
      setGlobalRankings(cached);
      setLoading(false);
      return;
    }

    if (!cached) setLoading(true);
    try {
      const res = await api.get('/leaderboards/global');
      const data = res.data?.data?.rankings || [];
      setGlobalRankings(data);
      useDataCacheStore.getState().set('leaderboard_global', data);
    } catch (err: any) {
      console.warn('[LeaderboardPage] Failed to fetch global leaderboard:', err.message);
      if (!cached) setGlobalRankings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProblemLeaderboard = async (probId: string, force: boolean = false) => {
    const cacheKey = `leaderboard_problem_${probId}`;
    const cached = useDataCacheStore.getState().get<LeaderboardEntry[]>(cacheKey);
    if (cached && !force) {
      setRankings(cached);
      setLoading(false);
      return;
    }

    if (!cached) setLoading(true);
    try {
      const res = await api.get(`/leaderboards/problem/${probId}`);
      const data = res.data?.data?.rankings || [];
      setRankings(data);
      useDataCacheStore.getState().set(cacheKey, data);
    } catch (err: any) {
      console.warn('[LeaderboardPage] Failed to fetch problem rankings:', err.message);
      if (!cached) setRankings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'problem' && selectedProblem) {
      fetchProblemLeaderboard(selectedProblem);
    } else if (activeTab === 'global') {
      fetchGlobalLeaderboard();
    }
  }, [activeTab, selectedProblem]);

  // Rank badge styling
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 font-black flex items-center justify-center text-xs">🥇</span>;
    if (rank === 2) return <span className="w-6 h-6 rounded-full bg-slate-400/20 text-slate-400 font-bold flex items-center justify-center text-xs">🥈</span>;
    if (rank === 3) return <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 font-bold flex items-center justify-center text-xs">🥉</span>;
    return <span className="w-6 h-6 text-[#656d76] dark:text-[#848d97] font-mono text-xs flex items-center justify-center font-bold">#{rank}</span>;
  };

  // League tier badges
  const getGlobalTierBadge = (score: number) => {
    if (score >= 400) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
          Grandmaster
        </span>
      );
    }
    if (score >= 250) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
          Master
        </span>
      );
    }
    if (score >= 100) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
          Knight
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
        Challenger
      </span>
    );
  };

  const currentProblem = problems.find((p) => p.id === selectedProblem);
  const currentProblemTitle = currentProblem?.title || 'Problem Leaderboard';

  // Dynamic podium entries
  const podiumEntries: PodiumEntry[] = useMemo(() => {
    if (activeTab === 'global') {
      return globalRankings.slice(0, 3).map((r) => ({
        rank: r.rank,
        username: r.username,
        avatarUrl: r.avatarUrl,
        score: Math.round(r.totalScore * 10) / 10,
        detail: `${r.problemsSolved} Solved`,
        streak: r.streak,
        userId: r.userId
      }));
    } else {
      return rankings.slice(0, 3).map((r) => ({
        rank: r.rank,
        username: r.username,
        score: r.compositeScore,
        detail: `${r.language} • ${r.breakdown?.rawTimeMs || 0}ms`,
        userId: r.userId
      }));
    }
  }, [activeTab, globalRankings, rankings]);

  // Authenticated user standing resolution
  const myGlobalStanding = useMemo(() => {
    if (!currentUserId || globalRankings.length === 0) return null;
    const myEntry = globalRankings.find((r) => r.userId === currentUserId);
    if (!myEntry) return null;

    const myRank = myEntry.rank;
    const percentile = Math.max(1, Math.round((myRank / globalRankings.length) * 100));
    const previousEntry = myRank > 1 ? globalRankings[myRank - 2] : null;
    const gapToNext = previousEntry
      ? Math.max(0, Math.round((previousEntry.totalScore - myEntry.totalScore) * 10) / 10)
      : 0;

    return {
      rank: myRank,
      totalRanked: globalRankings.length,
      percentile,
      score: Math.round(myEntry.totalScore * 10) / 10,
      gapToNext,
      solved: myEntry.problemsSolved,
      streak: myEntry.streak,
      username: myEntry.username,
      avatarUrl: myEntry.avatarUrl
    };
  }, [currentUserId, globalRankings]);

  // Smooth scroll to logged in user's row
  const handleScrollToMyRow = () => {
    if (!currentUserId) return;
    const rowEl = document.getElementById(`leaderboard-row-${currentUserId}`);
    if (rowEl) {
      rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      rowEl.classList.add('ring-2', 'ring-[#8250df]');
      setTimeout(() => {
        rowEl.classList.remove('ring-2', 'ring-[#8250df]');
      }, 2000);
    }
  };

  // Filtered global rankings
  const filteredGlobalRankings = useMemo(() => {
    if (!globalSearch.trim()) return globalRankings;
    const q = globalSearch.toLowerCase().trim();
    return globalRankings.filter((r) => r.username.toLowerCase().includes(q));
  }, [globalRankings, globalSearch]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#d0d7de] dark:border-[#30363d]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Trophy className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#656d76] dark:text-[#848d97]">
              Hall of Fame
            </span>
            <span className="text-xs font-mono text-[#8c959f]">&bull; Competitive Rankings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1f2328] dark:text-[#f0f6fc]">
            Platform Standings
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#656d76] dark:text-[#848d97]">
            Real-time, language-normalized composite scoring across deterministic sandbox executions and AI code quality evaluations.
          </p>
        </div>

        {/* Global vs Problem Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] self-start md:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('global')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'global'
                ? 'bg-white dark:bg-[#21262d] text-[#8250df] dark:text-[#bc8cff] shadow-xs border border-[#d0d7de] dark:border-[#30363d]'
                : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Global Standings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('problem')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'problem'
                ? 'bg-white dark:bg-[#21262d] text-[#8250df] dark:text-[#bc8cff] shadow-xs border border-[#d0d7de] dark:border-[#30363d]'
                : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Problem Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Championship Podium Hero */}
      {podiumEntries.length > 0 && (
        <LeaderboardPodium
          entries={podiumEntries}
          title={activeTab === 'global' ? 'Global Hall of Fame Champions' : `${currentProblemTitle} — Top Performers`}
          subtitle={
            activeTab === 'global'
              ? 'Peak composite scores across total solved catalog curriculum problems'
              : 'Fastest deterministic runtimes and highest code cleanliness scores'
          }
        />
      )}

      {/* Sticky "My Platform Standing" Card (When Logged In) */}
      {myGlobalStanding && activeTab === 'global' && (
        <div className="p-4 rounded-2xl border border-[#8250df]/30 bg-gradient-to-r from-[#8250df]/5 via-white to-purple-500/5 dark:from-[#8250df]/15 dark:via-[#161b22] dark:to-purple-950/20 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-11 h-11 rounded-full border-2 border-[#8250df] p-0.5 bg-white dark:bg-[#161b22] overflow-hidden flex items-center justify-center">
                {myGlobalStanding.avatarUrl ? (
                  <img src={myGlobalStanding.avatarUrl} alt={myGlobalStanding.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="w-full h-full rounded-full bg-[#8250df]/10 text-[#8250df] font-bold flex items-center justify-center text-xs">
                    {myGlobalStanding.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#8250df] text-white font-mono text-[9px] font-black shadow-xs">
                #{myGlobalStanding.rank}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                  Your Platform Rank
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#8250df]/15 text-[#8250df] dark:text-[#bc8cff]">
                  Top {myGlobalStanding.percentile}%
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-[#656d76] dark:text-[#848d97]">
                <span><strong>{myGlobalStanding.score}</strong> pts</span>
                <span>&bull;</span>
                <span>{myGlobalStanding.solved} Solved</span>
                {myGlobalStanding.streak > 0 && (
                  <>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold">
                      <Flame className="w-3 h-3 fill-amber-500" />
                      {myGlobalStanding.streak}d streak
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {myGlobalStanding.gapToNext > 0 && (
              <span className="text-[11px] text-[#656d76] dark:text-[#848d97] font-mono hidden md:inline">
                +{myGlobalStanding.gapToNext} pts to Rank #{myGlobalStanding.rank - 1}
              </span>
            )}
            <button
              type="button"
              onClick={handleScrollToMyRow}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-[#8250df]/40 bg-[#8250df]/10 hover:bg-[#8250df]/20 text-[#8250df] dark:text-[#bc8cff] text-xs font-bold cursor-pointer transition shadow-2xs"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Jump to My Row</span>
            </button>
          </div>
        </div>
      )}

      {/* Problem Selector Bar (Visible only when in Problem Mode) */}
      {activeTab === 'problem' && problems.length > 0 && (
        <div className="p-4 bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc]">
              Select Curriculum Problem:
            </span>
            {currentProblem?.difficulty && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                currentProblem.difficulty === 'EASY'
                  ? 'bg-[#dafbe1] text-[#1a7f37] dark:bg-[#1a7f37]/20 dark:text-[#3fb950] border-[#4ac26b]/30'
                  : currentProblem.difficulty === 'MEDIUM'
                  ? 'bg-[#fff8c5] text-[#9a6700] dark:bg-[#9a6700]/20 dark:text-[#d29922] border-[#d4a72c]/30'
                  : 'bg-[#ffebe9] text-[#cf222e] dark:bg-[#cf222e]/20 dark:text-[#ff7b72] border-[#ff8182]/30'
              }`}>
                {currentProblem.difficulty}
              </span>
            )}
          </div>

          <div className="relative min-w-[280px]">
            <select
              value={selectedProblem}
              onChange={(e) => setSelectedProblem(e.target.value)}
              className="w-full bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] text-xs text-[#1f2328] dark:text-[#f0f6fc] rounded-xl px-4 py-2 font-medium focus:outline-none focus:border-[#8250df] cursor-pointer"
            >
              {problems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} {p.difficulty ? `(${p.difficulty})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="p-16 text-center space-y-3 bg-white dark:bg-[#161b22] rounded-2xl border border-[#d0d7de] dark:border-[#30363d]">
          <Loader2 className="w-6 h-6 animate-spin text-[#8250df] mx-auto" />
          <p className="text-xs font-mono text-[#656d76] dark:text-[#848d97]">
            Fetching latest rankings from PostgreSQL & MongoDB...
          </p>
        </div>
      ) : activeTab === 'global' ? (
        globalRankings.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-[#161b22] rounded-2xl border border-[#d0d7de] dark:border-[#30363d] space-y-3">
            <Globe className="w-10 h-10 text-[#8250df] mx-auto opacity-60" />
            <h3 className="text-base font-bold text-[#1f2328] dark:text-[#f0f6fc]">
              No Global Rankings Recorded Yet
            </h3>
            <p className="text-xs text-[#656d76] dark:text-[#848d97] max-w-sm mx-auto">
              Solve problems with accepted solutions in the catalog to claim your spot in the Hall of Fame.
            </p>
            <Link
              to="/problems"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8250df] hover:bg-[#6639ba] text-white text-xs font-bold shadow-xs cursor-pointer transition"
            >
              <span>Browse Problem Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl overflow-hidden shadow-sm">
            {/* Table Header with Search */}
            <div className="p-5 border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-[#8250df]" />
                <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                  Global Platform Hall of Fame
                </h3>
                <span className="text-xs font-mono text-[#656d76] dark:text-[#848d97]">
                  ({filteredGlobalRankings.length} Ranked Developers)
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8c959f] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Search developer handle..."
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-xs text-[#1f2328] dark:text-[#f0f6fc] placeholder-[#8c959f] focus:outline-none focus:border-[#8250df] w-48 sm:w-56"
                />
              </div>
            </div>

            {/* Global Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#f6f8fa] dark:bg-[#161b22] text-[#656d76] dark:text-[#848d97] border-b border-[#d0d7de] dark:border-[#30363d]">
                  <tr>
                    <th className="py-2.5 px-4 w-14 text-center">Rank</th>
                    <th className="py-2.5 px-4 font-sans font-semibold">Developer & League</th>
                    <th className="py-2.5 px-4 font-sans font-semibold">Problems Solved</th>
                    <th className="py-2.5 px-4 font-sans font-semibold">Activity Streak</th>
                    <th className="py-2.5 px-4 font-sans font-semibold">Avg Runtime</th>
                    <th className="py-2.5 px-4 font-sans font-semibold text-right">Cumulative Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d0d7de]/60 dark:divide-[#30363d]/60">
                  {filteredGlobalRankings.map((entry) => {
                    const isMe = currentUserId && entry.userId === currentUserId;

                    return (
                      <tr
                        key={entry.userId}
                        id={`leaderboard-row-${entry.userId}`}
                        className={`transition ${
                          isMe
                            ? 'bg-[#8250df]/10 dark:bg-[#8250df]/15 ring-1 ring-inset ring-[#8250df]/30'
                            : 'hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]/50'
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3 px-4 text-center">{getRankBadge(entry.rank)}</td>

                        {/* Developer & League */}
                        <td className="py-3 px-4 font-sans">
                          <div className="flex items-center gap-2.5">
                            {entry.avatarUrl ? (
                              <img
                                src={entry.avatarUrl}
                                alt={entry.username}
                                className="w-6 h-6 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-[#8250df]/10 text-[#8250df] flex items-center justify-center text-xs font-bold shrink-0">
                                {entry.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-semibold text-xs text-[#1f2328] dark:text-[#f0f6fc]">
                              {entry.username}
                            </span>
                            {isMe && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#8250df] text-white">
                                YOU
                              </span>
                            )}
                            {getGlobalTierBadge(entry.totalScore)}
                          </div>
                        </td>

                        {/* Problems Solved */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#dafbe1] dark:bg-[#1a7f37]/20 text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b]/30">
                            <CheckCircle2 className="w-3 h-3 text-[#1a7f37] dark:text-[#3fb950]" />
                            {entry.problemsSolved} Solved
                          </span>
                        </td>

                        {/* Streak */}
                        <td className="py-3 px-4">
                          {entry.streak > 0 ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              {entry.streak} days
                            </span>
                          ) : (
                            <span className="text-[#8c959f]">--</span>
                          )}
                        </td>

                        {/* Avg Runtime */}
                        <td className="py-3 px-4 text-[#1f2328] dark:text-[#f0f6fc]">
                          <span className="inline-flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-[#656d76] dark:text-[#848d97]" />
                            {Math.round(entry.avgRuntimeMs)}ms
                          </span>
                        </td>

                        {/* Total Score */}
                        <td className="py-3 px-4 text-right">
                          <span className="font-bold text-sm bg-gradient-to-r from-[#8250df] to-[#2da44e] bg-clip-text text-transparent">
                            {Math.round(entry.totalScore * 10) / 10}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : rankings.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-[#161b22] rounded-2xl border border-[#d0d7de] dark:border-[#30363d] space-y-3">
          <Trophy className="w-10 h-10 text-amber-500 mx-auto opacity-60" />
          <h3 className="text-base font-bold text-[#1f2328] dark:text-[#f0f6fc]">
            No Ranked Submissions Yet
          </h3>
          <p className="text-xs text-[#656d76] dark:text-[#848d97] max-w-sm mx-auto">
            Be the first student to solve {currentProblemTitle} with an accepted solution and claim the #1 spot on the leaderboard!
          </p>
          {currentProblem?.slug && (
            <Link
              to={`/workspace/${currentProblem.slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8250df] hover:bg-[#6639ba] text-white text-xs font-bold shadow-xs cursor-pointer transition"
            >
              <span>Solve {currentProblemTitle}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      ) : (
        <LeaderboardView
          rankings={rankings}
          problemTitle={currentProblemTitle}
          highlightUserId={currentUserId}
        />
      )}
    </div>
  );
}
