import { useState, useEffect } from 'react';
import { Trophy, Globe, Flame, CheckCircle2, Clock, User as UserIcon, Loader2 } from 'lucide-react';
import { LeaderboardEntry, GlobalLeaderboardEntry } from '@aica/shared';
import { LeaderboardView } from '../components/LeaderboardView';
import { api } from '../services/api';
import { useDataCacheStore } from '../store/useDataCacheStore';

export function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<'global' | 'problem'>('global');
  const [problems, setProblems] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedProblem, setSelectedProblem] = useState<string>('');

  const cachedGlobal = useDataCacheStore.getState().get<GlobalLeaderboardEntry[]>('leaderboard_global');
  const [globalRankings, setGlobalRankings] = useState<GlobalLeaderboardEntry[]>(cachedGlobal || []);
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(!cachedGlobal);

  // Fetch published problems list on mount
  useEffect(() => {
    const loadProblems = async () => {
      const cachedCatalog = useDataCacheStore.getState().get<Array<{ id: string; title: string }>>('leaderboard_catalog_problems');
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

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 font-bold flex items-center justify-center text-xs">🥇</span>;
    if (rank === 2) return <span className="w-6 h-6 rounded-full bg-slate-300/20 text-slate-400 font-bold flex items-center justify-center text-xs">🥈</span>;
    if (rank === 3) return <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 font-bold flex items-center justify-center text-xs">🥉</span>;
    return <span className="w-6 h-6 text-slate-500 font-mono text-xs flex items-center justify-center">#{rank}</span>;
  };

  const currentProblemTitle =
    problems.find((p) => p.id === selectedProblem)?.title || 'Problem Leaderboard';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header and Toggle Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 dark:text-amber-400" />
            Platform Leaderboards
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('global')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'global'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Global Platform Standings
          </button>
          <button
            onClick={() => setActiveTab('problem')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'problem'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Problem Leaderboard
          </button>
        </div>
      </div>

      {/* Problem Selector (Visible only when in Problem Leaderboard mode) */}
      {activeTab === 'problem' && problems.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Select Problem Challenge:
          </span>
          <select
            value={selectedProblem}
            onChange={(e) => setSelectedProblem(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:border-indigo-500 font-medium"
          >
            {problems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="p-16 text-center space-y-3 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
          <p className="text-sm font-mono text-slate-500 dark:text-slate-400">Loading rankings...</p>
        </div>
      ) : activeTab === 'global' ? (
        globalRankings.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <Globe className="w-10 h-10 text-indigo-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No Global Rankings Recorded Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Solve problems with accepted solutions to establish the global platform standings.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Global Platform Hall of Fame
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {globalRankings.length} Ranked Developers
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">Rank</th>
                    <th className="py-3 px-4 font-sans font-semibold">Developer / Handle</th>
                    <th className="py-3 px-4 font-sans font-semibold">Problems Solved</th>
                    <th className="py-3 px-4 font-sans font-semibold">Streak</th>
                    <th className="py-3 px-4 font-sans font-semibold">Avg Runtime</th>
                    <th className="py-3 px-4 font-sans font-semibold text-right">Cumulative Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {globalRankings.map((entry) => (
                    <tr key={entry.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-center">{getRankBadge(entry.rank)}</td>
                      <td className="py-3.5 px-4 font-sans font-semibold text-slate-900 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          {entry.avatarUrl ? (
                            <img src={entry.avatarUrl} alt={entry.username} className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">
                              <UserIcon className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <span>{entry.username}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {entry.problemsSolved} Solved
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {entry.streak > 0 ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            {entry.streak} days
                          </span>
                        ) : (
                          <span className="text-slate-400">--</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {entry.avgRuntimeMs}ms
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                          {entry.totalScore}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : rankings.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Ranked Submissions Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Be the first student to solve {currentProblemTitle} with an accepted solution and claim the #1 spot on the leaderboard!
          </p>
        </div>
      ) : (
        <LeaderboardView rankings={rankings} problemTitle={currentProblemTitle} />
      )}
    </div>
  );
}
