import { useState, useMemo } from 'react';
import {
  Trophy,
  Clock,
  Cpu,
  Zap,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Search,
  Filter,
  Flame,
  Award,
  Sparkles,
  Layers,
  Code2
} from 'lucide-react';
import { LeaderboardEntry } from '@aica/shared';

interface LeaderboardViewProps {
  rankings: LeaderboardEntry[];
  problemTitle?: string;
  highlightUserId?: string;
  onSelectUser?: (userId: string, username: string) => void;
}

export function LeaderboardView({ rankings, problemTitle, highlightUserId, onSelectUser }: LeaderboardViewProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [searchHandle, setSearchHandle] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');

  const toggleRow = (subId: string) => {
    setExpandedRow(expandedRow === subId ? null : subId);
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 font-black flex items-center justify-center text-xs">🥇</span>;
    if (rank === 2) return <span className="w-6 h-6 rounded-full bg-slate-400/20 text-slate-400 font-bold flex items-center justify-center text-xs">🥈</span>;
    if (rank === 3) return <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-600 font-bold flex items-center justify-center text-xs">🥉</span>;
    return <span className="w-6 h-6 text-[#656d76] dark:text-[#848d97] font-mono text-xs flex items-center justify-center font-bold">#{rank}</span>;
  };

  const getTierBadge = (score: number) => {
    if (score >= 90) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
          Grandmaster
        </span>
      );
    }
    if (score >= 80) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
          Master
        </span>
      );
    }
    if (score >= 65) {
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

  // Distinct languages for dynamic filter
  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    rankings.forEach((r) => {
      if (r.language) set.add(r.language.toLowerCase());
    });
    return Array.from(set);
  }, [rankings]);

  // Client-side memoized filtering
  const filteredRankings = useMemo(() => {
    return rankings.filter((entry) => {
      const matchesSearch =
        !searchHandle.trim() ||
        entry.username.toLowerCase().includes(searchHandle.toLowerCase().trim());
      const matchesLang =
        selectedLanguage === 'ALL' ||
        entry.language.toLowerCase() === selectedLanguage.toLowerCase();
      return matchesSearch && matchesLang;
    });
  }, [rankings, searchHandle, selectedLanguage]);

  return (
    <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl overflow-hidden shadow-sm space-y-0">
      {/* Table Header Section */}
      <div className="p-5 border-b border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-2">
              <span>{problemTitle ? `${problemTitle} — Standings` : 'Problem Leaderboard'}</span>
              <span className="text-xs font-mono font-normal text-[#656d76] dark:text-[#848d97]">
                ({filteredRankings.length} entries)
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[11px] text-[#656d76] dark:text-[#848d97]">
                Normalized composite score: 50% Speed + 30% Memory + 20% AI Quality
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-[#1a7f37] dark:text-[#3fb950] bg-[#dafbe1] dark:bg-[#1a7f37]/20 px-2 py-0.5 rounded-full font-mono font-semibold">
                <ShieldCheck className="w-3 h-3" /> Correctness Gated (100% Passed)
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Controls Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Real-time search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8c959f] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchHandle}
              onChange={(e) => setSearchHandle(e.target.value)}
              placeholder="Filter developer handle..."
              className="pl-8 pr-3 py-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-xs text-[#1f2328] dark:text-[#f0f6fc] placeholder-[#8c959f] focus:outline-none focus:border-[#8250df] w-44 sm:w-52"
            />
          </div>

          {/* Language filter pills */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117]">
            <button
              onClick={() => setSelectedLanguage('ALL')}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                selectedLanguage === 'ALL'
                  ? 'bg-[#8250df] text-white'
                  : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
              }`}
            >
              All
            </button>
            {['python', 'cpp', 'java', 'javascript'].map((lang) => {
              const label =
                lang === 'python'
                  ? 'Python'
                  : lang === 'cpp'
                  ? 'C++'
                  : lang === 'java'
                  ? 'Java'
                  : 'JS';
              return (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                    selectedLanguage.toLowerCase() === lang
                      ? 'bg-[#8250df] text-white'
                      : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Standings Table */}
      {filteredRankings.length === 0 ? (
        <div className="p-12 text-center text-[#656d76] dark:text-[#848d97] text-xs space-y-1.5">
          <Award className="w-8 h-8 text-[#8c959f] mx-auto opacity-50" />
          <p className="font-semibold text-sm text-[#1f2328] dark:text-[#f0f6fc]">
            No Submissions Match Active Filters
          </p>
          <p className="text-[11px]">
            Try adjusting your handle search or language filter above.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#f6f8fa] dark:bg-[#161b22] text-[#656d76] dark:text-[#848d97] border-b border-[#d0d7de] dark:border-[#30363d]">
              <tr>
                <th className="py-2.5 px-4 w-14 text-center">Rank</th>
                <th className="py-2.5 px-4 font-sans font-semibold">Developer & League</th>
                <th className="py-2.5 px-4 font-sans font-semibold">Language</th>
                <th className="py-2.5 px-4 font-sans font-semibold">Runtime</th>
                <th className="py-2.5 px-4 font-sans font-semibold">Memory</th>
                <th className="py-2.5 px-4 font-sans font-semibold">AI Quality</th>
                <th className="py-2.5 px-4 font-sans font-semibold text-right">Composite Score</th>
                <th className="py-2.5 px-4 w-12 text-center">Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d0d7de]/60 dark:divide-[#30363d]/60">
              {filteredRankings.map((entry) => {
                const isExpanded = expandedRow === entry.submissionId;
                const isMe = highlightUserId && entry.userId === highlightUserId;

                return (
                  <tr
                    key={entry.submissionId}
                    id={`leaderboard-row-${entry.userId}`}
                    className={`group transition ${
                      isMe
                        ? 'bg-[#8250df]/10 dark:bg-[#8250df]/15 ring-1 ring-inset ring-[#8250df]/30'
                        : 'hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]/50'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-4 text-center">{getRankBadge(entry.rank)}</td>

                    {/* Developer */}
                    <td className="py-3 px-4 font-sans">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => onSelectUser && onSelectUser(entry.userId, entry.username)}
                          className={`font-semibold text-xs text-[#1f2328] dark:text-[#f0f6fc] text-left transition ${
                            onSelectUser ? 'hover:text-[#8250df] hover:underline cursor-pointer' : ''
                          }`}
                          title={onSelectUser ? `Inspect problems solved by ${entry.username}` : undefined}
                        >
                          {entry.username}
                        </button>
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#8250df] text-white">
                            YOU
                          </span>
                        )}
                        {getTierBadge(entry.compositeScore)}
                      </div>
                    </td>

                    {/* Language */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-[#8250df] dark:text-[#bc8cff] text-[11px] font-semibold">
                        <Code2 className="w-3 h-3" />
                        {entry.language}
                      </span>
                    </td>

                    {/* Runtime */}
                    <td className="py-3 px-4 text-[#1f2328] dark:text-[#f0f6fc]">
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-[#656d76] dark:text-[#848d97]" />
                        {entry.breakdown?.rawTimeMs}ms
                      </span>
                    </td>

                    {/* Memory */}
                    <td className="py-3 px-4 text-[#1f2328] dark:text-[#f0f6fc]">
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Cpu className="w-3 h-3 text-[#656d76] dark:text-[#848d97]" />
                        {Math.round((entry.breakdown?.rawMemoryKb || 0) / 1024)}MB
                      </span>
                    </td>

                    {/* AI Quality */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-[#1a7f37] dark:text-[#3fb950]">
                        <Sparkles className="w-3 h-3" />
                        {entry.breakdown?.qualityScore}/10
                      </span>
                    </td>

                    {/* Composite Score */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-bold text-sm bg-gradient-to-r from-[#8250df] to-[#2da44e] bg-clip-text text-transparent">
                        {entry.compositeScore}
                      </span>
                    </td>

                    {/* Breakdown Toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => toggleRow(entry.submissionId)}
                        className="p-1 rounded-md text-[#656d76] dark:text-[#848d97] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition cursor-pointer"
                        title={isExpanded ? 'Hide Score Breakdown' : 'Inspect Score Formula'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Expanded Breakdown Drawer for Active Row */}
      {expandedRow && (
        <div className="border-t border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] p-4 text-xs font-sans">
          {(() => {
            const entry = rankings.find((r) => r.submissionId === expandedRow);
            if (!entry || !entry.breakdown) return null;
            const b = entry.breakdown;

            return (
              <div className="max-w-3xl mx-auto space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#8250df]" />
                    Score Decomposition: {entry.username} ({entry.language})
                  </h4>
                  <span className="font-mono text-[10px] text-[#656d76] dark:text-[#848d97]">
                    Submission: {entry.submissionId.slice(-8)}
                  </span>
                </div>

                {/* 3 Metric Gauges */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Speed Gauge */}
                  <div className="p-3 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#656d76] dark:text-[#848d97] font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#8250df]" />
                        Speed (50%)
                      </span>
                      <span className="font-mono font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                        {b.timeScore} / 100
                      </span>
                    </div>
                    <div className="w-full bg-[#eaeef2] dark:bg-[#21262d] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#8250df] h-full"
                        style={{ width: `${Math.min(100, Math.max(5, b.timeScore))}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[#8c959f] block">
                      Raw: {b.rawTimeMs}ms • Norm: {b.normalizedTimeMs}ms
                    </span>
                  </div>

                  {/* Memory Gauge */}
                  <div className="p-3 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#656d76] dark:text-[#848d97] font-semibold flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-[#1a7f37]" />
                        Memory (30%)
                      </span>
                      <span className="font-mono font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                        {b.memoryScore} / 100
                      </span>
                    </div>
                    <div className="w-full bg-[#eaeef2] dark:bg-[#21262d] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#1a7f37] h-full"
                        style={{ width: `${Math.min(100, Math.max(5, b.memoryScore))}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[#8c959f] block">
                      Footprint: {Math.round(b.rawMemoryKb / 1024)}MB
                    </span>
                  </div>

                  {/* Quality Gauge */}
                  <div className="p-3 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#656d76] dark:text-[#848d97] font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        AI Quality (20%)
                      </span>
                      <span className="font-mono font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                        {b.qualityPoints} / 100
                      </span>
                    </div>
                    <div className="w-full bg-[#eaeef2] dark:bg-[#21262d] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full"
                        style={{ width: `${Math.min(100, Math.max(5, b.qualityPoints))}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[#8c959f] block">
                      Rating: {b.qualityScore} / 10.0
                    </span>
                  </div>
                </div>

                {/* Mathematical Formula Explanation */}
                <div className="p-2.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] text-[11px] text-[#656d76] dark:text-[#848d97] font-mono flex items-center justify-between">
                  <span>Formula: 0.50 × Speed ({b.timeScore}) + 0.30 × Memory ({b.memoryScore}) + 0.20 × Quality ({b.qualityPoints})</span>
                  <span className="font-bold text-[#1f2328] dark:text-[#f0f6fc] text-xs">
                    = {entry.compositeScore} pts
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
