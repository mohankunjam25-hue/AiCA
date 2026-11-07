import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Trophy,
  CheckCircle2,
  Flame,
  Award,
  Sparkles,
  ShieldCheck,
  UserPlus,
  UserCheck,
  ArrowRight,
  Loader2,
  Code2,
  Layers,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { DeveloperDirectoryItem } from '@aica/shared';
import { useAuthStore } from '../store/useAuthStore';
import { useDebounce } from '../hooks';

export function DeveloperDirectoryPage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [developers, setDevelopers] = useState<DeveloperDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [leagueFilter, setLeagueFilter] = useState<string>('ALL');
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [followerCountMap, setFollowerCountMap] = useState<Record<string, number>>({});

  const fetchDevelopers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/developers');
      if (res.data?.success && res.data?.data) {
        const devs: DeveloperDirectoryItem[] = res.data.data.developers || [];
        setDevelopers(devs);

        const fMap: Record<string, boolean> = {};
        const cMap: Record<string, number> = {};
        devs.forEach((d) => {
          fMap[d.userId] = Boolean(d.isFollowing);
          cMap[d.userId] = d.followerCount || 0;
        });
        setFollowingMap(fMap);
        setFollowerCountMap(cMap);
      }
    } catch (err) {
      console.error('[DeveloperDirectoryPage] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const handleToggleFollow = async (userId: string, username: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const currentStatus = followingMap[userId];
    const currentCount = followerCountMap[userId] || 0;

    // Optimistic UI update
    setFollowingMap((prev) => ({ ...prev, [userId]: !currentStatus }));
    setFollowerCountMap((prev) => ({
      ...prev,
      [userId]: currentStatus ? Math.max(0, currentCount - 1) : currentCount + 1
    }));

    try {
      const res = await api.post(`/developers/${userId}/follow`);
      if (res.data?.success) {
        setFollowingMap((prev) => ({ ...prev, [userId]: res.data.data.isFollowing }));
        setFollowerCountMap((prev) => ({ ...prev, [userId]: res.data.data.followerCount }));
      } else {
        // Rollback
        setFollowingMap((prev) => ({ ...prev, [userId]: currentStatus }));
        setFollowerCountMap((prev) => ({ ...prev, [userId]: currentCount }));
      }
    } catch {
      // Rollback
      setFollowingMap((prev) => ({ ...prev, [userId]: currentStatus }));
      setFollowerCountMap((prev) => ({ ...prev, [userId]: currentCount }));
    }
  };

  const filteredDevelopers = useMemo(() => {
    return developers.filter((dev) => {
      const q = debouncedSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        dev.username.toLowerCase().includes(q) ||
        (dev.fullName && dev.fullName.toLowerCase().includes(q)) ||
        dev.topSkills.some((s) => s.toLowerCase().includes(q));

      const matchesLeague =
        leagueFilter === 'ALL' || dev.league.toUpperCase() === leagueFilter.toUpperCase();

      return matchesSearch && matchesLeague;
    });
  }, [developers, debouncedSearch, leagueFilter]);

  const getTierBadge = (league?: string) => {
    const l = league || 'Challenger';
    if (l === 'Grandmaster') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800 inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-purple-500" />
          Grandmaster
        </span>
      );
    }
    if (l === 'Master') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 inline-flex items-center gap-1">
          <Award className="w-3 h-3 text-indigo-500" />
          Master
        </span>
      );
    }
    if (l === 'Knight') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 inline-flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          Knight
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 inline-flex items-center gap-1">
        Challenger
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#d0d7de] dark:border-[#30363d]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 rounded-md bg-[#8250df]/10 text-[#8250df] dark:text-[#bc8cff]">
              <Users className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#656d76] dark:text-[#848d97]">
              Community Network
            </span>
            <span className="text-xs font-mono text-[#8c959f]">&bull; Developer Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1f2328] dark:text-[#f0f6fc]">
            Discover & Follow Developers
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#656d76] dark:text-[#848d97]">
            Connect with algorithm engineers, follow their code solutions, and track top solvers across the curriculum.
          </p>
        </div>

        <Link
          to="/leaderboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] hover:border-[#8250df] transition shadow-2xs self-start md:self-auto"
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Hall of Fame Leaderboard</span>
        </Link>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8c959f] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by developer handle, full name, or algorithm tag (e.g. Graph, Dynamic Programming)..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-xs text-[#1f2328] dark:text-[#f0f6fc] placeholder-[#8c959f] focus:outline-none focus:border-[#8250df]"
            />
          </div>

          {/* League Filter Chips */}
          <div className="flex items-center gap-1 bg-[#eaeef2] dark:bg-[#21262d] p-1 rounded-xl shrink-0 overflow-x-auto">
            {['ALL', 'GRANDMASTER', 'MASTER', 'KNIGHT', 'CHALLENGER'].map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setLeagueFilter(tier)}
                className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition cursor-pointer capitalize ${
                  leagueFilter === tier
                    ? 'bg-white dark:bg-[#0d1117] text-[#8250df] dark:text-[#bc8cff] shadow-xs'
                    : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                }`}
              >
                {tier.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Developers Grid */}
      {loading ? (
        <div className="p-20 text-center space-y-3 bg-white dark:bg-[#161b22] rounded-2xl border border-[#d0d7de] dark:border-[#30363d]">
          <Loader2 className="w-8 h-8 animate-spin text-[#8250df] mx-auto" />
          <p className="text-xs font-mono text-[#656d76] dark:text-[#848d97]">
            Loading developer community directory...
          </p>
        </div>
      ) : filteredDevelopers.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-[#161b22] rounded-2xl border border-[#d0d7de] dark:border-[#30363d] space-y-3">
          <Users className="w-10 h-10 text-[#8c959f] mx-auto opacity-50" />
          <h3 className="text-base font-bold text-[#1f2328] dark:text-[#f0f6fc]">
            No Developers Match Your Search
          </h3>
          <p className="text-xs text-[#656d76] dark:text-[#848d97] max-w-sm mx-auto">
            Try adjusting your search query or selecting "All" in the league filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setLeagueFilter('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-[#8250df] text-white text-xs font-bold hover:bg-[#6639ba] transition shadow-xs cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevelopers.map((dev) => {
            const isMe = currentUser && currentUser.id === dev.userId;
            const isFollowed = followingMap[dev.userId];
            const followerCount = followerCountMap[dev.userId] || 0;

            return (
              <div
                key={dev.userId}
                className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] hover:border-[#8250df]/50 rounded-2xl p-5 shadow-sm transition space-y-4 flex flex-col justify-between group"
              >
                {/* Top: Avatar, Name, Handle, League */}
                <div className="flex items-start gap-3.5">
                  <Link to={`/developers/${dev.username}`} className="shrink-0">
                    {dev.avatarUrl ? (
                      <img
                        src={dev.avatarUrl}
                        alt={dev.username}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-[#8250df]/20 group-hover:ring-[#8250df] transition"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#8250df]/15 text-[#8250df] flex items-center justify-center font-bold text-lg ring-2 ring-[#8250df]/20 group-hover:ring-[#8250df] transition">
                        {dev.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Link
                        to={`/developers/${dev.username}`}
                        className="font-bold text-sm text-[#1f2328] dark:text-[#f0f6fc] hover:text-[#8250df] transition truncate"
                      >
                        {dev.fullName}
                      </Link>
                      {isMe && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#8250df] text-white shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-[#656d76] dark:text-[#848d97] truncate">
                      @{dev.username}
                    </p>
                    <div className="pt-1">{getTierBadge(dev.league)}</div>
                  </div>
                </div>

                {/* Middle: Performance Metric Chips */}
                <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de]/50 dark:border-[#30363d]/50 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-[#656d76] dark:text-[#848d97] block">
                      Solved
                    </span>
                    <span className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                      {dev.totalSolved}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#656d76] dark:text-[#848d97] block">
                      Score
                    </span>
                    <span className="text-xs font-bold text-[#8250df] dark:text-[#bc8cff]">
                      {dev.totalScore}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#656d76] dark:text-[#848d97] block">
                      Followers
                    </span>
                    <span className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                      {followerCount}
                    </span>
                  </div>
                </div>

                {/* Bottom: Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {!isMe && (
                    <button
                      type="button"
                      onClick={() => handleToggleFollow(dev.userId, dev.username)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isFollowed
                          ? 'bg-emerald-500/10 hover:bg-rose-500/15 border border-emerald-500/30 hover:border-rose-500/40 text-emerald-700 hover:text-rose-600 dark:text-emerald-400 dark:hover:text-rose-400 group/btn'
                          : 'bg-[#8250df] hover:bg-[#6639ba] text-white shadow-xs'
                      }`}
                    >
                      {isFollowed ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-500 group-hover/btn:hidden" />
                          <span className="group-hover/btn:hidden">Following</span>
                          <span className="hidden group-hover/btn:inline">Unfollow</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  )}

                  <Link
                    to={`/developers/${dev.username}`}
                    className={`${
                      isMe ? 'w-full' : 'w-auto'
                    } flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] hover:border-[#8250df] text-[#1f2328] dark:text-[#f0f6fc] text-xs font-bold transition shadow-2xs`}
                  >
                    <span>View Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#8250df]" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
