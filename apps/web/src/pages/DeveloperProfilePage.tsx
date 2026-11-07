import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
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
  ArrowRight,
  UserPlus,
  UserCheck,
  Lock,
  Unlock,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Github,
  Calendar,
  Users
} from 'lucide-react';
import { api } from '../services/api';
import { DeveloperProfileResponse, DeveloperSolvedItem } from '@aica/shared';
import { useAuthStore } from '../store/useAuthStore';

export function DeveloperProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuthStore();

  const [data, setData] = useState<DeveloperProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Follow state with optimistic updates
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  // Filters within solved problems
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | 'EASY' | 'MEDIUM' | 'HARD'>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

  // Expanded code view state
  const [expandedCodeProblemId, setExpandedCodeProblemId] = useState<string | null>(null);
  const [copiedProblemId, setCopiedProblemId] = useState<string | null>(null);

  const fetchProfile = async (silent = false) => {
    if (!username) return;
    if (!silent) setLoading(true);
    setError(null);

    try {
      const res = await api.get(`/developers/${username}`);
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
        setIsFollowing(Boolean(res.data.data.developer.isFollowing));
        setFollowerCount(res.data.data.developer.followerCount || 0);
      } else {
        setError(res.data?.error?.message || 'Developer not found');
      }
    } catch (err: any) {
      console.error('[DeveloperProfilePage] fetch error:', err);
      setError(err.response?.data?.error?.message || 'Failed to load developer profile');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  // Handle follow / unfollow toggle
  const handleToggleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!data?.developer?.userId) return;

    const previousState = isFollowing;
    const previousCount = followerCount;

    // Optimistic UI update
    setIsFollowing(!previousState);
    setFollowerCount(previousState ? Math.max(0, previousCount - 1) : previousCount + 1);
    setFollowLoading(true);

    try {
      const res = await api.post(`/developers/${data.developer.userId}/follow`);
      if (res.data?.success) {
        setIsFollowing(res.data.data.isFollowing);
        setFollowerCount(res.data.data.followerCount);
        // Refresh full profile silently to unlock codes if now following!
        fetchProfile(true);
      } else {
        // Rollback
        setIsFollowing(previousState);
        setFollowerCount(previousCount);
      }
    } catch (err) {
      console.error('[DeveloperProfilePage] follow error:', err);
      // Rollback
      setIsFollowing(previousState);
      setFollowerCount(previousCount);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCopyCode = (problemId: string, code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedProblemId(problemId);
    setTimeout(() => {
      setCopiedProblemId(null);
    }, 2000);
  };

  const developer = data?.developer;
  const isMe = developer?.isSelf;

  // Filter solved problems
  const filteredProblems = useMemo(() => {
    if (!data?.solvedProblems) return [];
    return data.solvedProblems.filter((p) => {
      const matchesDiff =
        difficultyFilter === 'ALL' || p.difficulty.toUpperCase() === difficultyFilter;
      const matchesTag = selectedTag === 'ALL' || p.tags.includes(selectedTag);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.language.toLowerCase().includes(q);
      return matchesDiff && matchesTag && matchesSearch;
    });
  }, [data?.solvedProblems, difficultyFilter, selectedTag, searchQuery]);

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
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800 inline-flex items-center gap-1.5 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          Grandmaster
        </span>
      );
    }
    if (l === 'Master') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 inline-flex items-center gap-1.5 shadow-xs">
          <Award className="w-3.5 h-3.5 text-indigo-500" />
          Master
        </span>
      );
    }
    if (l === 'Knight') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 inline-flex items-center gap-1.5 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Knight
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 inline-flex items-center gap-1.5 shadow-xs">
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
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#8250df] mx-auto" />
        <p className="text-sm font-mono text-[#656d76] dark:text-[#848d97]">
          Loading developer dossier & solved curriculum...
        </p>
      </div>
    );
  }

  if (error || !developer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="p-8 bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-[#1f2328] dark:text-[#f0f6fc]">
            Developer Dossier Not Found
          </h2>
          <p className="text-xs text-[#656d76] dark:text-[#848d97] max-w-sm mx-auto">
            {error || `We couldn't find a developer with the handle @${username}.`}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              to="/developers"
              className="px-4 py-2 rounded-xl bg-[#8250df] text-white text-xs font-bold hover:bg-[#6639ba] transition shadow-xs"
            >
              Browse All Developers
            </Link>
            <Link
              to="/leaderboard"
              className="px-4 py-2 rounded-xl border border-[#d0d7de] dark:border-[#30363d] text-xs font-bold hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition"
            >
              Hall of Fame Leaderboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const total = developer.totalSolved || 0;
  const easyCount = developer.difficultyBreakdown?.easy || 0;
  const medCount = developer.difficultyBreakdown?.medium || 0;
  const hardCount = developer.difficultyBreakdown?.hard || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs text-[#656d76] dark:text-[#848d97] pb-2 border-b border-[#d0d7de] dark:border-[#30363d]">
        <div className="flex items-center gap-2">
          <Link to="/developers" className="hover:text-[#8250df] transition">
            Developers
          </Link>
          <span>/</span>
          <span className="font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
            @{developer.username}
          </span>
        </div>

        <Link
          to="/developers"
          className="inline-flex items-center gap-1.5 hover:text-[#8250df] transition font-medium"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Developer Directory</span>
        </Link>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Developer Hero Dossier (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Identity Card */}
          <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col items-center text-center space-y-3">
              {/* Big Avatar with League Ring */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full p-1 bg-white dark:bg-[#161b22] shadow-md ring-4 ring-[#8250df]/30 overflow-hidden flex items-center justify-center">
                  {developer.avatarUrl ? (
                    <img
                      src={developer.avatarUrl}
                      alt={developer.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-[#8250df]/15 text-[#8250df] flex items-center justify-center font-black text-2xl">
                      {developer.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h1 className="text-xl font-extrabold text-[#1f2328] dark:text-[#f0f6fc]">
                  {developer.fullName}
                </h1>
                <p className="text-xs font-mono text-[#656d76] dark:text-[#848d97]">
                  @{developer.username}
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  {getTierBadge(developer.league)}
                </div>
              </div>
            </div>

            {/* Bio */}
            {developer.bio && (
              <p className="text-xs text-[#656d76] dark:text-[#848d97] text-center leading-relaxed px-2">
                {developer.bio}
              </p>
            )}

            {/* Action Button: Follow vs Edit Profile */}
            <div>
              {isMe ? (
                <Link
                  to="/profile"
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] hover:border-[#8250df] transition shadow-2xs"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#8250df]" />
                  <span>Your Profile Settings</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                    isFollowing
                      ? 'bg-emerald-500/10 hover:bg-rose-500/15 border border-emerald-500/30 hover:border-rose-500/40 text-emerald-700 hover:text-rose-600 dark:text-emerald-400 dark:hover:text-rose-400 group/btn'
                      : 'bg-gradient-to-r from-[#8250df] to-[#6639ba] hover:from-[#6639ba] hover:to-[#552ca8] text-white'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4 text-emerald-500 group-hover/btn:hidden" />
                      <span className="group-hover/btn:hidden">Following @{developer.username}</span>
                      <span className="hidden group-hover/btn:inline">Unfollow</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow to Unlock Code</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Social & Network Counts */}
            <div className="grid grid-cols-2 gap-3 py-3 border-y border-[#d0d7de]/60 dark:border-[#30363d]/60 text-center">
              <div>
                <p className="text-base font-black font-mono text-[#1f2328] dark:text-[#f0f6fc]">
                  {followerCount}
                </p>
                <p className="text-[11px] text-[#656d76] dark:text-[#848d97] font-medium">
                  Followers
                </p>
              </div>
              <div>
                <p className="text-base font-black font-mono text-[#1f2328] dark:text-[#f0f6fc]">
                  {developer.followingCount}
                </p>
                <p className="text-[11px] text-[#656d76] dark:text-[#848d97] font-medium">
                  Following
                </p>
              </div>
            </div>

            {/* Platform Standing Stats */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#656d76] dark:text-[#848d97] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1a7f37] dark:text-[#3fb950]" />
                  <span>Curriculum Solved</span>
                </span>
                <span className="font-mono font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                  {developer.totalSolved} Problems
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#656d76] dark:text-[#848d97] flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  <span>Cumulative Score</span>
                </span>
                <span className="font-mono font-bold text-[#8250df] dark:text-[#bc8cff]">
                  {developer.totalScore} pts
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#656d76] dark:text-[#848d97] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>Activity Streak</span>
                </span>
                <span className="font-mono font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                  {developer.streak > 0 ? `${developer.streak} days` : '--'}
                </span>
              </div>

              {developer.joinedAt && (
                <div className="flex items-center justify-between pt-1 text-[11px] text-[#8c959f]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Joined Platform</span>
                  </span>
                  <span>{formatRelativeDate(developer.joinedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Algorithm Skills Tree */}
          <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#8250df]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1f2328] dark:text-[#f0f6fc]">
                  Algorithm Mastery
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#656d76] dark:text-[#848d97]">
                {developer.skills.length} Categories
              </span>
            </div>

            {developer.skills.length === 0 ? (
              <p className="text-xs text-[#8c959f] text-center py-4">
                No algorithm categories recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {developer.skills.map((skill) => (
                  <div key={skill.tag} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-[#1f2328] dark:text-[#f0f6fc] font-medium">
                        {skill.tag}
                      </span>
                      <span className="text-[#656d76] dark:text-[#848d97]">
                        {skill.count} solved ({skill.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#eaeef2] dark:bg-[#21262d] overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, Math.max(8, skill.percentage))}%` }}
                        className="h-full bg-gradient-to-r from-[#8250df] to-[#2da44e] rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Solved Catalog & Follow-Gated Code Portfolio (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Difficulty Distribution Banner */}
          <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#1f2328] dark:text-[#f0f6fc]">Curriculum Progress Breakdown</span>
              <span className="font-mono text-[#656d76] dark:text-[#848d97]">
                {total} Total Solved
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-2 rounded-full bg-[#eaeef2] dark:bg-[#21262d] overflow-hidden flex">
              {total > 0 ? (
                <>
                  <div
                    style={{ width: `${(easyCount / total) * 100}%` }}
                    className="bg-emerald-500 h-full transition-all"
                  />
                  <div
                    style={{ width: `${(medCount / total) * 100}%` }}
                    className="bg-amber-500 h-full transition-all"
                  />
                  <div
                    style={{ width: `${(hardCount / total) * 100}%` }}
                    className="bg-rose-500 h-full transition-all"
                  />
                </>
              ) : (
                <div className="w-full h-full bg-[#d0d7de] dark:bg-[#30363d]" />
              )}
            </div>

            {/* Distribution Legend */}
            <div className="flex items-center gap-6 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[#656d76] dark:text-[#848d97]">Easy:</span>
                <span className="font-bold text-[#1f2328] dark:text-[#f0f6fc]">{easyCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-[#656d76] dark:text-[#848d97]">Medium:</span>
                <span className="font-bold text-[#1f2328] dark:text-[#f0f6fc]">{medCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-[#656d76] dark:text-[#848d97]">Hard:</span>
                <span className="font-bold text-[#1f2328] dark:text-[#f0f6fc]">{hardCount}</span>
              </div>
            </div>
          </div>

          {/* Search, Filter & Follow-Gate Status Notice */}
          <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#8250df]" />
                <h2 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                  Solved Challenges Portfolio ({filteredProblems.length})
                </h2>
              </div>

              {/* Difficulty Tabs */}
              <div className="flex items-center gap-1 bg-[#eaeef2] dark:bg-[#21262d] p-1 rounded-lg self-start sm:self-auto">
                {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficultyFilter(diff)}
                    className={`px-3 py-1 rounded-md text-xs font-bold font-mono transition cursor-pointer ${
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

            {/* Search Input & Tags */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8c959f] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search solved problems, algorithms, or tags..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-xs text-[#1f2328] dark:text-[#f0f6fc] placeholder-[#8c959f] focus:outline-none focus:border-[#8250df]"
                />
              </div>

              {/* Tag Filter Chips */}
              {developer.skills.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSelectedTag('ALL')}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                      selectedTag === 'ALL'
                        ? 'bg-[#8250df] text-white font-bold'
                        : 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328]'
                    }`}
                  >
                    All Tags
                  </button>
                  {developer.skills.slice(0, 6).map((s) => (
                    <button
                      key={s.tag}
                      type="button"
                      onClick={() => setSelectedTag(s.tag)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                        selectedTag === s.tag
                          ? 'bg-[#8250df] text-white font-bold'
                          : 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328]'
                      }`}
                    >
                      {s.tag} ({s.count})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Follow Gate Status Callout */}
            {!isMe && !isFollowing && (
              <div className="p-3.5 rounded-xl border border-purple-300 dark:border-purple-800/60 bg-purple-50/70 dark:bg-purple-950/20 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300">
                  <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>
                    <strong>Approach Code Gated:</strong> Follow @{developer.username} to unlock their accepted source code and AI complexity evaluations.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  className="px-3 py-1 rounded-lg bg-[#8250df] hover:bg-[#6639ba] text-white font-bold text-xs shrink-0 transition cursor-pointer shadow-2xs"
                >
                  Follow @{developer.username}
                </button>
              </div>
            )}
          </div>

          {/* Solved Problems List */}
          <div className="space-y-4">
            {filteredProblems.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-[#161b22] rounded-2xl border border-[#d0d7de] dark:border-[#30363d] space-y-2">
                <Code2 className="w-10 h-10 text-[#8c959f] mx-auto opacity-50" />
                <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                  No matching solved challenges found
                </h3>
                <p className="text-xs text-[#656d76] dark:text-[#848d97]">
                  Try clearing your search query or selecting "All" in the difficulty filter.
                </p>
              </div>
            ) : (
              filteredProblems.map((problem) => {
                const isExpanded = expandedCodeProblemId === problem.problemId;
                const isCopied = copiedProblemId === problem.problemId;

                return (
                  <div
                    key={problem.problemId}
                    className="p-5 rounded-2xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] hover:border-[#8250df]/40 transition space-y-4 shadow-sm"
                  >
                    {/* Top Row: Title, Difficulty, and Relative Date */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/workspace/${problem.slug}`}
                            className="font-bold text-sm sm:text-base text-[#1f2328] dark:text-[#f0f6fc] hover:text-[#8250df] transition"
                          >
                            {problem.title}
                          </Link>
                          {getDifficultyBadge(problem.difficulty)}
                        </div>

                        {/* Tags */}
                        {problem.tags.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {problem.tags.map((t) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97] border border-[#d0d7de]/60 dark:border-[#30363d]/60"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <span className="text-xs font-mono text-[#8c959f] shrink-0">
                        {formatRelativeDate(problem.solvedAt)}
                      </span>
                    </div>

                    {/* Performance Benchmarks Row */}
                    <div className="flex items-center gap-3 sm:gap-6 flex-wrap text-xs font-mono py-2 px-3 rounded-xl bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de]/50 dark:border-[#30363d]/50 text-[#656d76] dark:text-[#848d97]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#8250df]" />
                        <span className="font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                          {problem.bestRuntimeMs}ms
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-blue-500" />
                        <span>{Math.round(problem.bestMemoryKb / 1024)}MB</span>
                      </div>

                      <div className="flex items-center gap-1.5 capitalize">
                        <Code2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{problem.language}</span>
                      </div>

                      <div className="ml-auto flex items-center gap-1.5 font-bold text-[#8250df] dark:text-[#bc8cff]">
                        <Award className="w-3.5 h-3.5" />
                        <span>{problem.compositeScore} pts</span>
                      </div>
                    </div>

                    {/* FOLLOW GATE CODE AREA */}
                    {problem.isCodeLocked ? (
                      /* LOCKED STATE: Frosted Glass Gate */
                      <div className="relative rounded-xl border border-dashed border-[#d0d7de] dark:border-[#30363d] p-5 text-center bg-gradient-to-b from-[#f6f8fa]/80 to-[#eaeef2]/60 dark:from-[#161b22]/80 dark:to-[#0d1117]/60 space-y-2">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <h4 className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                          Solution Approach & Code Protected
                        </h4>
                        <p className="text-[11px] text-[#656d76] dark:text-[#848d97] max-w-sm mx-auto">
                          Follow @{developer.username} to unlock their accepted source code and compare their algorithmic approach.
                        </p>
                        <button
                          type="button"
                          onClick={handleToggleFollow}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8250df] hover:bg-[#6639ba] text-white text-xs font-bold transition shadow-2xs cursor-pointer mt-1"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow @{developer.username} to Unlock</span>
                        </button>
                      </div>
                    ) : (
                      /* UNLOCKED STATE: Expandable Code Viewer */
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedCodeProblemId(isExpanded ? null : problem.problemId)
                            }
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8250df] dark:text-[#bc8cff] hover:underline cursor-pointer"
                          >
                            <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                            <span>
                              {isExpanded ? 'Hide Accepted Solution' : 'View Accepted Solution Code'}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <Link
                            to={`/workspace/${problem.slug}`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#8250df]/10 hover:bg-[#8250df] text-[#8250df] hover:text-white dark:bg-[#8250df]/20 dark:hover:bg-[#8250df] dark:text-[#bc8cff] dark:hover:text-white text-xs font-bold transition"
                          >
                            <span>Solve in IDE</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>

                        {/* Expanded Code Box */}
                        {isExpanded && problem.code && (
                          <div className="rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-[#0d1117] text-[#e6edf3] p-4 text-xs font-mono space-y-2">
                            <div className="flex items-center justify-between pb-2 border-b border-[#30363d] text-[#8b949e]">
                              <span className="capitalize">{problem.language} Source</span>
                              <button
                                type="button"
                                onClick={() => handleCopyCode(problem.problemId, problem.code)}
                                className="inline-flex items-center gap-1 hover:text-white transition cursor-pointer"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-emerald-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy Snippet</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="overflow-x-auto p-2 leading-relaxed whitespace-pre font-mono text-[12px]">
                              {problem.code}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
