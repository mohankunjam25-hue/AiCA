import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Trophy,
  CheckCircle2,
  Clock,
  Cpu,
  Code2,
  Sparkles,
  Search,
  ExternalLink,
  Flame,
  Award,
  Layers,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { DeveloperSolvedResponse, DeveloperSolvedProblemItem } from '@aica/shared';
import { useAuthStore } from '../store/useAuthStore';

interface DeveloperSolvedDrawerProps {
  userId: string | null;
  initialUsername?: string;
  onClose: () => void;
}

export function DeveloperSolvedDrawer({
  userId,
  initialUsername,
  onClose
}: DeveloperSolvedDrawerProps) {
  const navigate = useNavigate();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [data, setData] = useState<DeveloperSolvedResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');

  // Fetch developer solved problems when userId changes
  useEffect(() => {
    if (!userId) {
      setData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    setSearchQuery('');
    setDifficultyFilter('ALL');

    api
      .get(`/leaderboards/user/${userId}/solved`)
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.success && res.data?.data) {
          setData(res.data.data);
        } else {
          setError('Failed to load developer dossier');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('[DeveloperSolvedDrawer] fetch error:', err);
        setError('Could not retrieve solved problems at this time.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Handle ESC key and prevent body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && userId) {
        onClose();
      }
    };

    if (userId) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [userId, onClose]);

  // Filtered solved problems
  const filteredProblems = useMemo(() => {
    if (!data?.solvedProblems) return [];
    return data.solvedProblems.filter((p) => {
      const matchesDiff =
        difficultyFilter === 'ALL' || p.difficulty.toUpperCase() === difficultyFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.language.toLowerCase().includes(q);
      return matchesDiff && matchesSearch;
    });
  }, [data?.solvedProblems, difficultyFilter, searchQuery]);

  if (!userId) return null;

  const developer = data?.developer;
  const username = developer?.username || initialUsername || 'Developer';
  const isMe = currentUserId && currentUserId === userId;

  const getDifficultyBadge = (diff: string) => {
    const d = diff.toUpperCase();
    if (d === 'EASY') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
          Easy
        </span>
      );
    }
    if (d === 'HARD') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800">
          Hard
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
        Medium
      </span>
    );
  };

  const getTierBadge = (league?: string) => {
    const l = league || 'Challenger';
    if (l === 'Grandmaster') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800 inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-500" />
          Grandmaster
        </span>
      );
    }
    if (l === 'Master') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 inline-flex items-center gap-1">
          <Award className="w-3 h-3 text-indigo-500" />
          Master
        </span>
      );
    }
    if (l === 'Knight') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 inline-flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          Knight
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 inline-flex items-center gap-1">
        Challenger
      </span>
    );
  };

  const formatRelativeDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const diffMs = Date.now() - d.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHrs < 1) return 'Just now';
      if (diffHrs < 24) return `${diffHrs}h ago`;
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 30) return `${diffDays}d ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const total = developer?.totalSolved || 0;
  const easyCount = developer?.difficultyBreakdown?.easy || 0;
  const medCount = developer?.difficultyBreakdown?.medium || 0;
  const hardCount = developer?.difficultyBreakdown?.hard || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Semi-transparent Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white dark:bg-[#0d1117] border-l border-[#d0d7de] dark:border-[#30363d] shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {developer?.avatarUrl ? (
                <img
                  src={developer.avatarUrl}
                  alt={username}
                  className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-[#8250df]/30"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#8250df]/15 text-[#8250df] flex items-center justify-center font-bold text-base shrink-0 ring-2 ring-[#8250df]/30">
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#1f2328] dark:text-[#f0f6fc] truncate">
                    {username}
                  </h2>
                  {isMe && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#8250df] text-white shrink-0">
                      YOU
                    </span>
                  )}
                  {getTierBadge(developer?.league)}
                </div>
                <p className="text-xs text-[#656d76] dark:text-[#848d97] flex items-center gap-1.5 mt-0.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>Developer Solved Catalog Dossier</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] hover:bg-[#eaeef2] dark:hover:bg-[#21262d] transition cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {loading ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#8250df] mx-auto" />
                <p className="text-xs font-mono text-[#656d76] dark:text-[#848d97]">
                  Loading {username}'s solved problems...
                </p>
              </div>
            ) : error ? (
              <div className="p-8 text-center bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-3">
                <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">
                  Error Loading Dossier
                </h3>
                <p className="text-xs text-[#656d76] dark:text-[#848d97] max-w-xs mx-auto">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    api.get(`/leaderboards/user/${userId}/solved`).then((res) => {
                      if (res.data?.success) setData(res.data.data);
                      setLoading(false);
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#8250df] text-white text-xs font-bold hover:bg-[#6639ba] transition cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            ) : developer ? (
              <>
                {/* 4 Stats Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d]">
                    <div className="flex items-center gap-1.5 text-xs text-[#656d76] dark:text-[#848d97] font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#1a7f37] dark:text-[#3fb950]" />
                      <span>Total Solved</span>
                    </div>
                    <p className="mt-1 text-lg font-black font-mono text-[#1f2328] dark:text-[#f0f6fc]">
                      {developer.totalSolved}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d]">
                    <div className="flex items-center gap-1.5 text-xs text-[#656d76] dark:text-[#848d97] font-medium">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      <span>Total Score</span>
                    </div>
                    <p className="mt-1 text-lg font-black font-mono text-[#8250df] dark:text-[#bc8cff]">
                      {developer.totalScore}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d]">
                    <div className="flex items-center gap-1.5 text-xs text-[#656d76] dark:text-[#848d97] font-medium">
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>Streak</span>
                    </div>
                    <p className="mt-1 text-lg font-black font-mono text-[#1f2328] dark:text-[#f0f6fc]">
                      {developer.streak > 0 ? `${developer.streak}d` : '--'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d]">
                    <div className="flex items-center gap-1.5 text-xs text-[#656d76] dark:text-[#848d97] font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      <span>League</span>
                    </div>
                    <p className="mt-1 text-xs font-bold font-mono text-[#1f2328] dark:text-[#f0f6fc] truncate">
                      {developer.league}
                    </p>
                  </div>
                </div>

                {/* Difficulty Breakdown Bar */}
                <div className="p-4 rounded-xl bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#1f2328] dark:text-[#f0f6fc]">Difficulty Distribution</span>
                    <span className="font-mono text-[#656d76] dark:text-[#848d97]">
                      {total} Solved Problems
                    </span>
                  </div>

                  {/* Multi-segmented Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-[#eaeef2] dark:bg-[#21262d] overflow-hidden flex">
                    {total > 0 ? (
                      <>
                        <div
                          style={{ width: `${(easyCount / total) * 100}%` }}
                          className="bg-emerald-500 h-full transition-all"
                          title={`Easy: ${easyCount}`}
                        />
                        <div
                          style={{ width: `${(medCount / total) * 100}%` }}
                          className="bg-amber-500 h-full transition-all"
                          title={`Medium: ${medCount}`}
                        />
                        <div
                          style={{ width: `${(hardCount / total) * 100}%` }}
                          className="bg-rose-500 h-full transition-all"
                          title={`Hard: ${hardCount}`}
                        />
                      </>
                    ) : (
                      <div className="w-full h-full bg-[#d0d7de] dark:bg-[#30363d]" />
                    )}
                  </div>

                  {/* Distribution Legend Chips */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span className="text-[#656d76] dark:text-[#848d97]">Easy:</span>
                      <span className="font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                        {easyCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span className="text-[#656d76] dark:text-[#848d97]">Medium:</span>
                      <span className="font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                        {medCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      <span className="text-[#656d76] dark:text-[#848d97]">Hard:</span>
                      <span className="font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                        {hardCount}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Search & Filter Header */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#8250df]" />
                      <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                        Solved Problems ({filteredProblems.length})
                      </h3>
                    </div>

                    {/* Difficulty Chips Filter */}
                    <div className="flex items-center gap-1 bg-[#eaeef2] dark:bg-[#21262d] p-1 rounded-lg self-start sm:self-auto">
                      {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setDifficultyFilter(diff)}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-bold font-mono transition cursor-pointer ${
                            difficultyFilter === diff
                              ? 'bg-white dark:bg-[#0d1117] text-[#8250df] dark:text-[#bc8cff] shadow-xs'
                              : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#8c959f] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter by problem title, topic tag, or language..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] text-xs text-[#1f2328] dark:text-[#f0f6fc] placeholder-[#8c959f] focus:outline-none focus:border-[#8250df]"
                    />
                  </div>
                </div>

                {/* Solved Problems List */}
                <div className="space-y-3">
                  {filteredProblems.length === 0 ? (
                    <div className="p-8 text-center bg-[#f6f8fa] dark:bg-[#161b22] rounded-xl border border-[#d0d7de] dark:border-[#30363d] space-y-2">
                      <Code2 className="w-8 h-8 text-[#8c959f] mx-auto opacity-50" />
                      <p className="text-xs font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
                        No matching solved problems found
                      </p>
                      <p className="text-[11px] text-[#656d76] dark:text-[#848d97]">
                        Try selecting another difficulty filter or clearing your search term.
                      </p>
                    </div>
                  ) : (
                    filteredProblems.map((p) => (
                      <div
                        key={p.problemId}
                        className="p-4 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] hover:border-[#8250df]/50 transition space-y-3 group shadow-2xs"
                      >
                        {/* Top: Title & Difficulty */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-[#1f2328] dark:text-[#f0f6fc] group-hover:text-[#8250df] transition">
                                {p.title}
                              </span>
                              {getDifficultyBadge(p.difficulty)}
                            </div>

                            {/* Tags */}
                            {p.tags.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {p.tags.map((t) => (
                                  <span
                                    key={t}
                                    className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97] border border-[#d0d7de]/60 dark:border-[#30363d]/60"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Relative Date */}
                          <span className="text-[11px] font-mono text-[#8c959f] shrink-0">
                            {formatRelativeDate(p.solvedAt)}
                          </span>
                        </div>

                        {/* Mid: Performance Metrics Badge Row */}
                        <div className="flex items-center gap-2 sm:gap-4 flex-wrap text-xs font-mono pt-1 border-t border-[#d0d7de]/50 dark:border-[#30363d]/50 text-[#656d76] dark:text-[#848d97]">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#8250df]" />
                            <span className="font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                              {p.bestRuntimeMs}ms
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Cpu className="w-3.5 h-3.5 text-blue-500" />
                            <span>{Math.round(p.bestMemoryKb / 1024)}MB</span>
                          </div>

                          <div className="flex items-center gap-1 capitalize">
                            <Code2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{p.language}</span>
                          </div>

                          <div className="ml-auto flex items-center gap-1 font-bold text-[#8250df] dark:text-[#bc8cff]">
                            <Award className="w-3.5 h-3.5" />
                            <span>{p.compositeScore} pts</span>
                          </div>
                        </div>

                        {/* Bottom Action: Solve Problem Link */}
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[10px] text-[#8c959f] italic">
                            🔒 Source code protected by academic integrity
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              navigate(`/workspace/${p.slug}`);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#8250df]/10 hover:bg-[#8250df] text-[#8250df] hover:text-white dark:bg-[#8250df]/20 dark:hover:bg-[#8250df] dark:text-[#bc8cff] dark:hover:text-white text-xs font-bold transition cursor-pointer"
                          >
                            <span>Solve Problem</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] flex items-center justify-between shrink-0 text-xs">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/developers/${username}`);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#8250df] hover:bg-[#6639ba] text-white font-bold transition shadow-2xs cursor-pointer"
            >
              <span>View Full Profile Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] font-bold hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
