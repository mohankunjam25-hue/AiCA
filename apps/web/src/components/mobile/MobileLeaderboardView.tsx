import React from 'react';
import { Trophy, Search, Flame, CheckCircle2, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { LeaderboardEntry, GlobalLeaderboardEntry } from '@aica/shared';
import type { PodiumEntry } from '../LeaderboardPodium';

interface ProblemItem {
  id: string;
  title: string;
  slug?: string;
}

interface MobileLeaderboardViewProps {
  activeTab: 'global' | 'problem';
  setActiveTab: (tab: 'global' | 'problem') => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  problems: ProblemItem[];
  selectedProblem: string;
  setSelectedProblem: (id: string) => void;
  loading: boolean;
  fetchError: string | null;
  podiumEntries: PodiumEntry[];
  filteredGlobalRankings: GlobalLeaderboardEntry[];
  rankings: LeaderboardEntry[];
  currentUserId?: string;
  myGlobalStanding: {
    rank: number;
    totalRanked: number;
    score: number;
    solved: number;
  } | null;
  onSelectDeveloper: (userId: string, username: string) => void;
  onRetry: () => void;
}

export function MobileLeaderboardView({
  activeTab,
  setActiveTab,
  globalSearch,
  setGlobalSearch,
  problems,
  selectedProblem,
  setSelectedProblem,
  loading,
  fetchError,
  podiumEntries,
  filteredGlobalRankings,
  rankings,
  currentUserId,
  myGlobalStanding,
  onSelectDeveloper,
  onRetry,
}: MobileLeaderboardViewProps) {
  const first = podiumEntries.find((p) => p.rank === 1) || podiumEntries[0];
  const second = podiumEntries.find((p) => p.rank === 2) || podiumEntries[1];
  const third = podiumEntries.find((p) => p.rank === 3) || podiumEntries[2];

  return (
    <div className="md:hidden flex flex-col gap-3.5 px-3.5 py-4 bg-[#f6f8fa] dark:bg-[#010409] text-[#1f2328] dark:text-[#e6edf3]">
      {/* Segmented Switcher */}
      <div className="p-1 rounded-2xl bg-[#eaeef2] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('global')}
          className={`h-9 rounded-xl text-xs font-bold transition active:scale-95 ${
            activeTab === 'global'
              ? 'bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] shadow-xs'
              : 'text-[#656d76] dark:text-[#848d97]'
          }`}
        >
          Global Standings
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('problem')}
          className={`h-9 rounded-xl text-xs font-bold transition active:scale-95 ${
            activeTab === 'problem'
              ? 'bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] shadow-xs'
              : 'text-[#656d76] dark:text-[#848d97]'
          }`}
        >
          By Challenge
        </button>
      </div>

      {/* Filter / Search Input */}
      {activeTab === 'global' ? (
        <div className="relative">
          <Search className="w-4 h-4 text-[#656d76] dark:text-[#848d97] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search developer handle..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-xs font-medium focus:outline-none focus:border-[#8250df]"
          />
        </div>
      ) : (
        <select
          value={selectedProblem}
          onChange={(e) => setSelectedProblem(e.target.value)}
          className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-xs font-semibold"
        >
          {problems.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      )}

      {/* Your Standing Highlight Banner */}
      {activeTab === 'global' && myGlobalStanding && (
        <div className="px-4 py-3 rounded-2xl bg-gradient-to-r from-[#8250df]/15 to-[#0969da]/10 border border-[#8250df]/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-[#8250df] dark:text-[#bc8cff]">
              Your Current Standing
            </span>
            <div className="text-sm font-black font-mono text-[#1f2328] dark:text-[#f0f6fc]">
              Rank #{myGlobalStanding.rank}{' '}
              <span className="text-xs font-normal text-[#656d76] dark:text-[#848d97]">
                of {myGlobalStanding.totalRanked}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-black font-mono text-[#8250df] dark:text-[#bc8cff]">
              {myGlobalStanding.score} pts
            </div>
            <div className="text-[10px] font-mono text-[#656d76] dark:text-[#848d97]">
              {myGlobalStanding.solved} Solved
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-[#656d76]">
          <Loader2 className="w-6 h-6 animate-spin text-[#8250df]" />
          <span className="text-xs font-mono">Loading leaderboard...</span>
        </div>
      ) : fetchError ? (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-center space-y-3">
          <p className="text-xs font-semibold text-[#cf222e]">{fetchError}</p>
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-xl bg-[#8250df] text-white text-xs font-bold"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Compact Mobile 3-Podium Top Section */}
          {podiumEntries.length > 0 && (
            <div className="grid grid-cols-3 gap-2 items-end pt-2">
              {/* Rank #2 */}
              {second ? (
                <button
                  type="button"
                  onClick={() => second.userId && onSelectDeveloper(second.userId, second.username)}
                  className="p-2.5 rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-center space-y-1 active:scale-95 transition"
                >
                  <span className="text-base">🥈</span>
                  <div className="text-[11px] font-bold truncate">{second.username}</div>
                  <div className="text-[11px] font-mono font-black text-[#656d76] dark:text-[#848d97]">
                    {second.score}
                  </div>
                </button>
              ) : <div />}

              {/* Rank #1 */}
              {first && (
                <button
                  type="button"
                  onClick={() => first.userId && onSelectDeveloper(first.userId, first.username)}
                  className="p-3 rounded-2xl bg-gradient-to-b from-amber-500/15 to-white dark:to-[#161b22] border border-amber-500/40 text-center space-y-1 shadow-xs active:scale-95 transition"
                >
                  <span className="text-xl">🥇</span>
                  <div className="text-xs font-extrabold truncate">{first.username}</div>
                  <div className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">
                    {first.score} pts
                  </div>
                </button>
              )}

              {/* Rank #3 */}
              {third ? (
                <button
                  type="button"
                  onClick={() => third.userId && onSelectDeveloper(third.userId, third.username)}
                  className="p-2.5 rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-center space-y-1 active:scale-95 transition"
                >
                  <span className="text-base">🥉</span>
                  <div className="text-[11px] font-bold truncate">{third.username}</div>
                  <div className="text-[11px] font-mono font-black text-[#656d76] dark:text-[#848d97]">
                    {third.score}
                  </div>
                </button>
              ) : <div />}
            </div>
          )}

          {/* Native Ranked List Tiles */}
          <div className="rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] divide-y divide-[#d0d7de]/70 dark:divide-[#30363d] overflow-hidden">
            {activeTab === 'global' ? (
              filteredGlobalRankings.map((entry) => {
                const isMe = currentUserId && entry.userId === currentUserId;
                return (
                  <button
                    key={entry.userId}
                    type="button"
                    onClick={() => onSelectDeveloper(entry.userId, entry.username)}
                    className={`w-full text-left flex items-center justify-between gap-3 px-3.5 py-3 min-h-[58px] active:bg-[#eaeef2] dark:active:bg-[#21262d] transition ${
                      isMe ? 'bg-[#8250df]/10 dark:bg-[#8250df]/15' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 text-center font-mono text-xs font-black text-[#656d76] dark:text-[#848d97] shrink-0">
                        #{entry.rank}
                      </span>
                      {entry.avatarUrl ? (
                        <img
                          src={entry.avatarUrl}
                          alt={entry.username}
                          loading="lazy"
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#8250df]/15 text-[#8250df] font-bold text-xs flex items-center justify-center shrink-0">
                          {entry.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-1.5 truncate">
                          <span className="truncate">{entry.username}</span>
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#8250df] text-white">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-[#656d76] dark:text-[#848d97] mt-0.5">
                          <span className="flex items-center gap-0.5 text-[#1a7f37] dark:text-[#3fb950]">
                            <CheckCircle2 className="w-2.5 h-2.5" /> {entry.problemsSolved}
                          </span>
                          {entry.streak > 0 && (
                            <span className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                              <Flame className="w-2.5 h-2.5" /> {entry.streak}d
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-black font-mono text-[#8250df] dark:text-[#bc8cff]">
                        {Math.round(entry.totalScore * 10) / 10}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#8c959f]" />
                    </div>
                  </button>
                );
              })
            ) : rankings.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Trophy className="w-8 h-8 text-amber-500 mx-auto opacity-60" />
                <p className="text-xs font-semibold text-[#656d76]">No ranked solutions yet</p>
              </div>
            ) : (
              rankings.map((entry) => {
                const isMe = currentUserId && entry.userId === currentUserId;
                return (
                  <button
                    key={entry.userId}
                    type="button"
                    onClick={() => onSelectDeveloper(entry.userId, entry.username)}
                    className={`w-full text-left flex items-center justify-between gap-3 px-3.5 py-3 min-h-[56px] active:bg-[#eaeef2] dark:active:bg-[#21262d] transition ${
                      isMe ? 'bg-[#8250df]/10 dark:bg-[#8250df]/15' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 text-center font-mono text-xs font-black text-[#656d76] dark:text-[#848d97] shrink-0">
                        #{entry.rank}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{entry.username}</div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-[#656d76] dark:text-[#848d97] mt-0.5">
                          <span>{entry.language}</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> {entry.breakdown?.rawTimeMs || 0}ms
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-black font-mono text-[#0969da] dark:text-[#58a6ff]">
                        {entry.compositeScore}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#8c959f]" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
