import { Trophy, Crown, Flame, Medal, Sparkles, User as UserIcon } from 'lucide-react';

export interface PodiumEntry {
  rank: number;
  username: string;
  avatarUrl?: string;
  score: number | string;
  detail: string;
  subDetail?: string;
  streak?: number;
  userId?: string;
}

interface LeaderboardPodiumProps {
  entries: PodiumEntry[];
  title?: string;
  subtitle?: string;
  onSelectUser?: (userId: string, username: string) => void;
}

export function LeaderboardPodium({ entries, title, subtitle, onSelectUser }: LeaderboardPodiumProps) {
  const first = entries.find((e) => e.rank === 1);
  const second = entries.find((e) => e.rank === 2);
  const third = entries.find((e) => e.rank === 3);

  if (!first && !second && !third) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#d0d7de] dark:border-[#30363d] bg-gradient-to-b from-white via-[#f6f8fa] to-[#eaeef2] dark:from-[#161b22] dark:via-[#0d1117] dark:to-[#090d13] p-6 sm:p-8 shadow-sm">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/10 dark:bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative text-center max-w-md mx-auto mb-8 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{title || 'Championship Podium'}</span>
        </div>
        <p className="text-xs text-[#656d76] dark:text-[#848d97]">
          {subtitle || 'Top 3 developers with peak algorithmic performance & composite accuracy'}
        </p>
      </div>

      {/* Podium Grid (2nd, 1st, 3rd) */}
      <div className="relative grid grid-cols-3 gap-2 sm:gap-6 items-end max-w-2xl mx-auto pt-4">
        {/* 2nd Place (Silver - Left) */}
        <div className="flex flex-col items-center text-center">
          {second ? (
            <div
              className={`w-full flex flex-col items-center space-y-2 ${
                onSelectUser && second.userId
                  ? 'cursor-pointer group hover:scale-[1.03] transition-transform duration-200'
                  : ''
              }`}
              onClick={() => {
                if (onSelectUser && second.userId) {
                  onSelectUser(second.userId, second.username);
                }
              }}
              title={onSelectUser && second.userId ? `Inspect problems solved by ${second.username}` : undefined}
            >
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#8c959f] dark:border-[#6e7681] p-0.5 shadow-md bg-white dark:bg-[#161b22] overflow-hidden flex items-center justify-center">
                  {second.avatarUrl ? (
                    <img src={second.avatarUrl} alt={second.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm">
                      {second.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#8c959f] text-white text-xs font-bold flex items-center justify-center shadow-xs">
                  2
                </span>
              </div>

              <div className="min-w-0 w-full px-1">
                <h4 className="font-bold text-xs sm:text-sm text-[#1f2328] dark:text-[#f0f6fc] truncate group-hover:text-[#8250df] transition">
                  {second.username}
                </h4>
                <span className="font-mono font-extrabold text-xs text-[#656d76] dark:text-[#848d97] block">
                  {second.score} pts
                </span>
                <span className="text-[10px] text-[#8c959f] dark:text-[#6e7681] truncate block mt-0.5">
                  {second.detail}
                </span>
              </div>

              {/* Silver Pedestal */}
              <div className="w-full h-24 sm:h-28 rounded-t-2xl border-t-2 border-x-2 border-[#8c959f]/40 bg-gradient-to-b from-[#eaeef2] to-[#d0d7de] dark:from-[#21262d] dark:to-[#161b22] flex flex-col items-center justify-center shadow-inner">
                <Medal className="w-6 h-6 text-[#8c959f] dark:text-[#6e7681] mb-1" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#656d76] dark:text-[#848d97]">
                  Silver
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center opacity-40">
              <div className="w-12 h-12 rounded-full border border-dashed border-[#8c959f] mb-2" />
              <div className="w-full h-20 rounded-t-xl bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d]" />
            </div>
          )}
        </div>

        {/* 1st Place (Gold - Center) */}
        <div className="flex flex-col items-center text-center">
          {first ? (
            <div
              className={`w-full flex flex-col items-center space-y-2 ${
                onSelectUser && first.userId
                  ? 'cursor-pointer group hover:scale-[1.03] transition-transform duration-200'
                  : ''
              }`}
              onClick={() => {
                if (onSelectUser && first.userId) {
                  onSelectUser(first.userId, first.username);
                }
              }}
              title={onSelectUser && first.userId ? `Inspect problems solved by ${first.username}` : undefined}
            >
              <div className="relative">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-amber-500 animate-bounce">
                  <Crown className="w-6 h-6 fill-amber-500 text-amber-600" />
                </div>
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-3 border-amber-500 p-0.5 shadow-lg bg-white dark:bg-[#161b22] overflow-hidden flex items-center justify-center ring-4 ring-amber-500/20">
                  {first.avatarUrl ? (
                    <img src={first.avatarUrl} alt={first.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-700 dark:text-amber-300 font-extrabold text-base">
                      {first.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white text-xs font-black flex items-center justify-center shadow-md">
                  1
                </span>
              </div>

              <div className="min-w-0 w-full px-1">
                <h4 className="font-extrabold text-sm sm:text-base text-[#1f2328] dark:text-[#f0f6fc] truncate group-hover:text-amber-600 transition">
                  {first.username}
                </h4>
                <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400 block">
                  {first.score} pts
                </span>
                <div className="flex items-center justify-center gap-1.5 mt-0.5">
                  <span className="text-[11px] font-semibold text-[#1a7f37] dark:text-[#3fb950]">
                    {first.detail}
                  </span>
                  {typeof first.streak === 'number' && first.streak > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {first.streak}d
                    </span>
                  )}
                </div>
              </div>

              {/* Gold Champion Pedestal */}
              <div className="w-full h-32 sm:h-36 rounded-t-2xl border-t-2 border-x-2 border-amber-500/50 bg-gradient-to-b from-amber-100/80 via-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:via-amber-950/20 dark:to-[#161b22] flex flex-col items-center justify-center shadow-lg">
                <Trophy className="w-8 h-8 text-amber-500 mb-1 drop-shadow-sm" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Champion
                </span>
              </div>
            </div>
          ) : null}
        </div>

        {/* 3rd Place (Bronze - Right) */}
        <div className="flex flex-col items-center text-center">
          {third ? (
            <div
              className={`w-full flex flex-col items-center space-y-2 ${
                onSelectUser && third.userId
                  ? 'cursor-pointer group hover:scale-[1.03] transition-transform duration-200'
                  : ''
              }`}
              onClick={() => {
                if (onSelectUser && third.userId) {
                  onSelectUser(third.userId, third.username);
                }
              }}
              title={onSelectUser && third.userId ? `Inspect problems solved by ${third.username}` : undefined}
            >
              <div className="relative">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-amber-700/60 dark:border-amber-700 p-0.5 shadow-md bg-white dark:bg-[#161b22] overflow-hidden flex items-center justify-center">
                  {third.avatarUrl ? (
                    <img src={third.avatarUrl} alt={third.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-amber-800 dark:text-amber-400 font-bold text-sm">
                      {third.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                  3
                </span>
              </div>

              <div className="min-w-0 w-full px-1">
                <h4 className="font-bold text-xs sm:text-sm text-[#1f2328] dark:text-[#f0f6fc] truncate group-hover:text-[#8250df] transition">
                  {third.username}
                </h4>
                <span className="font-mono font-extrabold text-xs text-[#656d76] dark:text-[#848d97] block">
                  {third.score} pts
                </span>
                <span className="text-[10px] text-[#8c959f] dark:text-[#6e7681] truncate block mt-0.5">
                  {third.detail}
                </span>
              </div>

              {/* Bronze Pedestal */}
              <div className="w-full h-20 sm:h-24 rounded-t-2xl border-t-2 border-x-2 border-amber-800/40 bg-gradient-to-b from-[#f3e7df] to-[#e4d3c6] dark:from-[#2e2019] dark:to-[#161b22] flex flex-col items-center justify-center shadow-inner">
                <Medal className="w-5 h-5 text-amber-700 dark:text-amber-500 mb-1" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                  Bronze
                </span>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center opacity-40">
              <div className="w-12 h-12 rounded-full border border-dashed border-[#8c959f] mb-2" />
              <div className="w-full h-16 rounded-t-xl bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d]" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
