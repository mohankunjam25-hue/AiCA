import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Github,
  Calendar,
  Award,
  Zap,
  Flame,
  CheckCircle2,
  Clock,
  HardDrive,
  BarChart2,
  ExternalLink,
  Edit3,
  Share2,
  Code2,
  Trophy,
  Layers,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  Camera,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Laptop,
  Bell,
  Lock,
  LogOut,
  KeyRound,
  Sliders,
  Type,
  FileCode,
  Sparkles,
  Activity,
  TrendingUp
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { useEditorPreferencesStore } from '../store/useEditorPreferencesStore';
import { api } from '../services/api';

interface PastEvolution {
  id: string;
  problemId: string;
  problemTitle: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  language: string;
  initialRuntimeMs: number;
  optimalRuntimeMs: number;
  initialMemoryMb: number;
  optimalMemoryMb: number;
  speedupPercent: number;
  pedagogicalVerdict: string;
  date: string;
}

const SAMPLE_EVOLUTIONS: PastEvolution[] = [
  {
    id: 'evo-1',
    problemId: 'two-sum-optimal',
    problemTitle: 'Two Sum',
    difficulty: 'Easy',
    language: 'Python',
    initialRuntimeMs: 1420,
    optimalRuntimeMs: 18,
    initialMemoryMb: 14.1,
    optimalMemoryMb: 15.3,
    speedupPercent: 98.7,
    pedagogicalVerdict: 'Replaced O(N²) quadratic nested loop with single-pass hash map',
    date: '2 hours ago',
  },
  {
    id: 'evo-2',
    problemId: 'longest-substring-without-repeating',
    problemTitle: 'Longest Substring Without Repeating',
    difficulty: 'Medium',
    language: 'TypeScript',
    initialRuntimeMs: 980,
    optimalRuntimeMs: 14,
    initialMemoryMb: 36.2,
    optimalMemoryMb: 37.1,
    speedupPercent: 98.5,
    pedagogicalVerdict: 'Dynamic sliding window eliminated inner substring re-scans',
    date: 'Yesterday',
  },
  {
    id: 'evo-3',
    problemId: 'valid-parentheses',
    problemTitle: 'Valid Parentheses',
    difficulty: 'Easy',
    language: 'C++',
    initialRuntimeMs: 120,
    optimalRuntimeMs: 2,
    initialMemoryMb: 7.8,
    optimalMemoryMb: 8.1,
    speedupPercent: 98.3,
    pedagogicalVerdict: 'std::stack linear scan with O(1) matching table',
    date: '3 days ago',
  },
  {
    id: 'evo-4',
    problemId: 'merge-intervals',
    problemTitle: 'Merge Intervals',
    difficulty: 'Medium',
    language: 'Python',
    initialRuntimeMs: 840,
    optimalRuntimeMs: 32,
    initialMemoryMb: 18.2,
    optimalMemoryMb: 18.9,
    speedupPercent: 96.2,
    pedagogicalVerdict: 'O(N log N) greedy merge after sorting start coordinates',
    date: '5 days ago',
  },
];

const BADGES = [
  {
    id: 'badge-1',
    name: 'Quadratic Slayer',
    description: 'Transformed an O(N²) quadratic algorithm into O(N) linear time',
    icon: Zap,
    color: 'from-amber-500 to-emerald-500',
    unlocked: true,
    earnedAt: 'Nov 2026',
  },
  {
    id: 'badge-2',
    name: 'Sub-10ms Sprinter',
    description: 'Passed 100% hidden Judge0 test cases in under 10 milliseconds',
    icon: Clock,
    color: 'from-emerald-500 to-teal-500',
    unlocked: true,
    earnedAt: 'Nov 2026',
  },
  {
    id: 'badge-3',
    name: 'Memory Minimalist',
    description: 'Achieved optimal space complexity with zero heap leakage',
    icon: HardDrive,
    color: 'from-indigo-500 to-cyan-500',
    unlocked: true,
    earnedAt: 'Nov 2026',
  },
  {
    id: 'badge-4',
    name: '5-Day Evolution Streak',
    description: 'Submitted algorithmic solutions for 5 consecutive days',
    icon: Flame,
    color: 'from-rose-500 to-amber-500',
    unlocked: true,
    earnedAt: 'Nov 2026',
  },
  {
    id: 'badge-5',
    name: 'Polyglot Architect',
    description: 'Solved problems across 3 different programming languages',
    icon: Code2,
    color: 'from-purple-500 to-indigo-500',
    unlocked: true,
    earnedAt: 'Nov 2026',
  },
  {
    id: 'badge-6',
    name: 'Kernel Isolation Master',
    description: 'Surpassed 50 isolated Linux cgroup evaluations',
    icon: ShieldCheck,
    color: 'from-slate-600 to-slate-900',
    unlocked: false,
    earnedAt: 'Locked',
  },
];

type ProfileTab = 'info' | 'settings' | 'activity' | 'logout';

export function ProfilePage() {
  const { user, profile, updateProfile, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const editorPrefs = useEditorPreferencesStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Active tab state initialized or synced with ?tab= query param
  const paramTab = searchParams.get('tab') as ProfileTab | null;
  const validTabs: ProfileTab[] = ['info', 'settings', 'activity', 'logout'];
  const initialTab: ProfileTab = paramTab && validTabs.includes(paramTab) ? paramTab : 'info';

  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sub-navigation state for 2-Pane nested layout
  const [infoSubTab, setInfoSubTab] = useState<'metrics' | 'dossier' | 'skills' | 'all'>('metrics');
  const [settingsSubTab, setSettingsSubTab] = useState<'appearance' | 'editor' | 'notifications' | 'security' | 'all'>('appearance');
  const [activitySubTab, setActivitySubTab] = useState<'heatmap' | 'submissions' | 'badges' | 'all'>('heatmap');

  // Edit form state
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [githubHandle, setGithubHandle] = useState(profile?.githubHandle || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Settings: Notification preferences
  const [notifyVerdicts, setNotifyVerdicts] = useState(true);
  const [notifyStreaks, setNotifyStreaks] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(false);

  // Settings: Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Sync tab with URL
  useEffect(() => {
    if (paramTab && validTabs.includes(paramTab) && paramTab !== activeTab) {
      setActiveTab(paramTab);
    }
  }, [paramTab]);

  const handleTabSelect = (tab: ProfileTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setBio(profile.bio || '');
      setGithubHandle(profile.githubHandle || '');
      setAvatarUrl(profile.avatarUrl || '');
    }
  }, [profile]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRandomAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setAvatarUrl(`https://api.dicebear.com/7.x/identicon/svg?seed=${randomSeed}`);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const res = await api.patch('/auth/profile', {
        fullName,
        bio,
        githubHandle,
        avatarUrl,
      });

      const updated = res.data.data.profile;
      updateProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSaveSuccess(false);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!currentPassword) {
      setPasswordStatus({ type: 'error', message: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match.' });
      return;
    }

    setUpdatingPassword(true);
    setTimeout(() => {
      setUpdatingPassword(false);
      setPasswordStatus({ type: 'success', message: 'Your password has been securely updated!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 800);
  };

  const handleLogoutConfirm = () => {
    logout();
    navigate('/login');
  };

  // Generate 24 weeks of activity heatmap data (memoized to eliminate render allocations)
  const heatmapWeeks = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, wIdx) =>
        Array.from({ length: 7 }).map((_, dIdx) => {
          const val = (wIdx * 7 + dIdx * 3) % 11;
          return val > 6 ? (val % 4) + 1 : 0;
        })
      ),
    []
  );
  const realSubmissions = Array.isArray((profile as any)?.submissions)
    ? (profile as any).submissions
    : [];

  return (
    <div className="flex-1 bg-[#FAFAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 selection:bg-emerald-100 selection:text-emerald-950">
      {/* ================================================================== */}
      {/* 1. HERO IDENTITY CARD                                              */}
      {/* ================================================================== */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 pt-8 pb-7">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* User Identity info */}
            <div className="flex items-start sm:items-center gap-5">
              <div className="relative group shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 border-2 border-emerald-500/40 p-0.5 shadow-md overflow-hidden">
                  {profile?.avatarUrl || avatarUrl ? (
                    <img
                      src={profile?.avatarUrl || avatarUrl}
                      alt={user?.username}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-full bg-emerald-950/80 rounded-xl flex items-center justify-center text-3xl font-black text-emerald-400">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition cursor-pointer"
                  title="Change Avatar"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {profile?.fullName || user?.username}
                  </h1>
                  <span className="text-xs font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                    Level 4 • Diamond
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    @{user?.username}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {user?.email || 'student@aica.dev'}
                  </span>
                  {profile?.githubHandle && (
                    <>
                      <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                      <a
                        href={`https://github.com/${profile.githubHandle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
                      >
                        <Github className="w-3.5 h-3.5" />
                        github/{profile.githubHandle}
                      </a>
                    </>
                  )}
                </div>

                {profile?.bio && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl pt-1 leading-relaxed">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 self-start md:self-center">
              <button
                type="button"
                onClick={handleShare}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Share</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs hover:shadow transition flex items-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-400 dark:text-white" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. TAB NAVIGATION (With Dynamic Blur Focus Effect)                 */}
      {/* ================================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex border-b border-[#d0d7de] dark:border-[#30363d] gap-2 sm:gap-4 text-xs font-semibold overflow-x-auto pb-px">
          {/* Profile Info */}
          <button
            type="button"
            onClick={() => handleTabSelect('info')}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-all duration-300 cursor-pointer whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-[#0969da] dark:border-[#58a6ff] text-[#1f2328] dark:text-[#f0f6fc] font-bold opacity-100 blur-none'
                : 'border-transparent text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] opacity-60 blur-[0.4px] hover:opacity-100 hover:blur-none'
            }`}
          >
            <UserIcon className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff]" />
            <span>Profile Info</span>
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => handleTabSelect('settings')}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-all duration-300 cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-[#0969da] dark:border-[#58a6ff] text-[#1f2328] dark:text-[#f0f6fc] font-bold opacity-100 blur-none'
                : 'border-transparent text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] opacity-60 blur-[0.4px] hover:opacity-100 hover:blur-none'
            }`}
          >
            <SettingsIcon className="w-4 h-4 text-[#57606a] dark:text-[#8b949e]" />
            <span>Settings</span>
          </button>

          {/* Activity & Badges */}
          <button
            type="button"
            onClick={() => handleTabSelect('activity')}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-all duration-300 cursor-pointer whitespace-nowrap ${
              activeTab === 'activity'
                ? 'border-[#0969da] dark:border-[#58a6ff] text-[#1f2328] dark:text-[#f0f6fc] font-bold opacity-100 blur-none'
                : 'border-transparent text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] opacity-60 blur-[0.4px] hover:opacity-100 hover:blur-none'
            }`}
          >
            <Award className="w-4 h-4 text-[#9a6700] dark:text-[#d29922]" />
            <span>Activity & Badges</span>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={() => handleTabSelect('logout')}
            className={`pb-3 px-3.5 border-b-2 flex items-center gap-2 transition-all duration-300 cursor-pointer whitespace-nowrap ${
              activeTab === 'logout'
                ? 'border-[#cf222e] dark:border-[#f85149] text-[#cf222e] dark:text-[#f85149] font-bold opacity-100 blur-none'
                : 'border-transparent text-[#656d76] dark:text-[#848d97] hover:text-[#cf222e] dark:hover:text-[#f85149] opacity-60 blur-[0.4px] hover:opacity-100 hover:blur-none'
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* ================================================================ */}
          {/* LEFT SUB-MENU SIDEBAR (Nested Navigation Under Active Tab)       */}
          {/* ================================================================ */}
          <aside className="md:col-span-3 lg:col-span-3 space-y-4 md:sticky md:top-20">
            {/* 1. Sub-menu for Profile Info */}
            {activeTab === 'info' && (
              <div className="rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] p-3 shadow-xs">
                <div className="px-3 py-2 border-b border-[#d0d7de] dark:border-[#30363d] mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#57606a] dark:text-[#8b949e] flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-[#0969da] dark:text-[#58a6ff]" />
                    Profile Dossier
                  </span>
                </div>
                <nav className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setInfoSubTab('metrics')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                      infoSubTab === 'metrics'
                        ? 'bg-[#0969da]/10 dark:bg-[#58a6ff]/15 text-[#0969da] dark:text-[#58a6ff] font-semibold border-l-2 border-[#0969da] dark:border-[#58a6ff]'
                        : 'text-[#656d76] dark:text-[#848d97] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Core Metrics</span>
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${infoSubTab === 'metrics' ? 'opacity-100 translate-x-0.5' : 'opacity-0'}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setInfoSubTab('dossier')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                      infoSubTab === 'dossier'
                        ? 'bg-[#0969da]/10 dark:bg-[#58a6ff]/15 text-[#0969da] dark:text-[#58a6ff] font-semibold border-l-2 border-[#0969da] dark:border-[#58a6ff]'
                        : 'text-[#656d76] dark:text-[#848d97] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <UserIcon className="w-3.5 h-3.5" />
                      <span>Developer Dossier</span>
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${infoSubTab === 'dossier' ? 'opacity-100 translate-x-0.5' : 'opacity-0'}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setInfoSubTab('skills')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                      infoSubTab === 'skills'
                        ? 'bg-[#0969da]/10 dark:bg-[#58a6ff]/15 text-[#0969da] dark:text-[#58a6ff] font-semibold border-l-2 border-[#0969da] dark:border-[#58a6ff]'
                        : 'text-[#656d76] dark:text-[#848d97] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Skills & Languages</span>
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${infoSubTab === 'skills' ? 'opacity-100 translate-x-0.5' : 'opacity-0'}`} />
                  </button>

                  <div className="pt-1 border-t border-[#d0d7de] dark:border-[#30363d] mt-1">
                    <button
                      type="button"
                      onClick={() => setInfoSubTab('all')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                        infoSubTab === 'all'
                          ? 'bg-[#0969da]/10 dark:bg-[#58a6ff]/15 text-[#0969da] dark:text-[#58a6ff] font-semibold border-l-2 border-[#0969da] dark:border-[#58a6ff]'
                          : 'text-[#656d76] dark:text-[#848d97] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5" />
                        <span>View All Sections</span>
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${infoSubTab === 'all' ? 'opacity-100 translate-x-0.5' : 'opacity-0'}`} />
                    </button>
                  </div>
                </nav>
              </div>
            )}

            {/* 2. Sub-menu for Settings */}
            {activeTab === 'settings' && (
              <div className="rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] p-3 shadow-xs">
                <div className="px-3 py-2 border-b border-[#d0d7de] dark:border-[#30363d] mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#57606a] dark:text-[#8b949e] flex items-center gap-1.5">
                    <SettingsIcon className="w-3.5 h-3.5 text-[#0969da] dark:text-[#58a6ff]" />
                    Settings Menu
                  </span>
                </div>
                <nav className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('appearance')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                      settingsSubTab === 'appearance'
                        ? 'bg-[#0969da]/10 dark:bg-[#58a6ff]/15 text-[#0969da] dark:text-[#58a6ff] font-semibold border-l-2 border-[#0969da] dark:border-[#58a6ff]'
                        : 'text-[#656d76] dark:text-[#848d97] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Sun className="w-3.5 h-3.5" />
                      <span>Appearance & Theme</span>
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${settingsSubTab === 'appearance' ? 'opacity-100 translate-x-0.5' : 'opacity-0'}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('editor')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                      settingsSubTab === 'editor'
                        ? 'bg-[#0969da]/10 dark:bg-[#58a6ff]/15 text-[#0969da] dark:text-[#58a6ff] font-semibold border-l-2 border-[#0969da] dark:border-[#58a6ff]'
                        : 'text-[#656d76] dark:text-[#848d97] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Monaco Code Editor</span>
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${settingsSubTab === 'editor' ? 'opacity-100 translate-x-0.5' : 'opacity-0'}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('notifications')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                      settingsSubTab === 'notifications'
                        ? 'bg-[#0969da]/10 dark:bg-[#58a6ff]/15 text-[#0969da] dark:text-[#58a6ff] font-semibold border-l-2 border-[#0969da] dark:border-[#58a6ff]'
                        : 'text-[#656d76] dark:text-[#848d97] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5" />
                      <span>Execution Alerts</span>
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${settingsSubTab === 'notifications' ? 'opacity-100 translate-x-0.5' : 'opacity-0'}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettingsSubTab('security')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                      settingsSubTab === 'security'
                        ? 'bg-[#0969da]/10 dark:bg-[#58a6ff]/15 text-[#0969da] dark:text-[#58a6ff] font-semibold border-l-2 border-[#0969da] dark:border-[#58a6ff]'
                        : 'text-[#656d76] dark:text-[#848d97] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Account Security</span>
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${settingsSubTab === 'security' ? 'opacity-100 translate-x-0.5' : 'opacity-0'}`} />
                  </button>

                  <div className="pt-1 border-t border-[#d0d7de] dark:border-[#30363d] mt-1">
                    <button
                      type="button"
                      onClick={() => setSettingsSubTab('all')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                        settingsSubTab === 'all'
                          ? 'bg-[#0969da]/10 dark:bg-[#58a6ff]/15 text-[#0969da] dark:text-[#58a6ff] font-semibold border-l-2 border-[#0969da] dark:border-[#58a6ff]'
                          : 'text-[#656d76] dark:text-[#848d97] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Sliders className="w-3.5 h-3.5" />
                        <span>All Preferences</span>
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${settingsSubTab === 'all' ? 'opacity-100 translate-x-0.5' : 'opacity-0'}`} />
                    </button>
                  </div>
                </nav>
              </div>
            )}

            {/* 3. Sub-menu for Activity & Badges */}
            {activeTab === 'activity' && (
              <div className="rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] p-3 shadow-xs">
                <div className="px-3 py-2 border-b border-[#d0d7de] dark:border-[#30363d] mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#57606a] dark:text-[#8b949e] flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#d29922]" />
                    Activity Digest
                  </span>
                </div>
                <nav className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setActivitySubTab('heatmap')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                      activitySubTab === 'heatmap'
                        ? 'bg-[#0969da]/10 dark:bg-[#58a6ff]/15 text-[#0969da] dark:text-[#58a6ff] font-semibold border-l-2 border-[#0969da] dark:border-[#58a6ff]'
                        : 'text-[#656d76] dark:text-[#848d97] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>52-Week Heatmap</span>
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activitySubTab === 'heatmap' ? 'opacity-100 translate-x-0.5' : 'opacity-0'}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivitySubTab('submissions')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                      activitySubTab === 'submissions'
                        ? 'bg-[#0969da]/10 dark:bg-[#58a6ff]/15 text-[#0969da] dark:text-[#58a6ff] font-semibold border-l-2 border-[#0969da] dark:border-[#58a6ff]'
                        : 'text-[#656d76] dark:text-[#848d97] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Evolutions & Runs</span>
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activitySubTab === 'submissions' ? 'opacity-100 translate-x-0.5' : 'opacity-0'}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivitySubTab('badges')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                      activitySubTab === 'badges'
                        ? 'bg-[#0969da]/10 dark:bg-[#58a6ff]/15 text-[#0969da] dark:text-[#58a6ff] font-semibold border-l-2 border-[#0969da] dark:border-[#58a6ff]'
                        : 'text-[#656d76] dark:text-[#848d97] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5" />
                      <span>Mastery Badges</span>
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activitySubTab === 'badges' ? 'opacity-100 translate-x-0.5' : 'opacity-0'}`} />
                  </button>

                  <div className="pt-1 border-t border-[#d0d7de] dark:border-[#30363d] mt-1">
                    <button
                      type="button"
                      onClick={() => setActivitySubTab('all')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition cursor-pointer ${
                        activitySubTab === 'all'
                          ? 'bg-[#0969da]/10 dark:bg-[#58a6ff]/15 text-[#0969da] dark:text-[#58a6ff] font-semibold border-l-2 border-[#0969da] dark:border-[#58a6ff]'
                          : 'text-[#656d76] dark:text-[#848d97] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Full Activity Digest</span>
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activitySubTab === 'all' ? 'opacity-100 translate-x-0.5' : 'opacity-0'}`} />
                    </button>
                  </div>
                </nav>
              </div>
            )}

            {/* 4. Sub-menu for Logout */}
            {activeTab === 'logout' && (
              <div className="rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] p-4 shadow-xs space-y-3">
                <div className="border-b border-[#d0d7de] dark:border-[#30363d] pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#cf222e] dark:text-[#f85149] flex items-center gap-1.5">
                    <LogOut className="w-3.5 h-3.5" />
                    Session Control
                  </span>
                </div>
                <p className="text-xs text-[#57606a] dark:text-[#8b949e] leading-relaxed">
                  Terminating your session clears authentication tokens from this local browser instance.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleTabSelect('info')}
                    className="w-full py-2 px-3 rounded-lg border border-[#d0d7de] dark:border-[#30363d] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] text-xs font-semibold text-[#1f2328] dark:text-[#f0f6fc] transition cursor-pointer text-center"
                  >
                    Return to Profile
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* ================================================================ */}
          {/* RIGHT DYNAMIC CONTENT PANE                                       */}
          {/* ================================================================ */}
          <main className="md:col-span-9 lg:col-span-9 min-w-0 space-y-6">
            {/* ============================================================ */}
            {/* TAB 1: PROFILE INFO PANE                                     */}
            {/* ============================================================ */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                {/* 1.1 Core Metrics Section */}
                {(infoSubTab === 'metrics' || infoSubTab === 'all') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#d0d7de] dark:border-[#30363d] pb-2">
                      <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Core Performance Metrics
                      </h3>
                      <span className="text-[11px] font-medium text-[#57606a] dark:text-[#8b949e]">
                        Live telemetry stats
                      </span>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-5 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[#57606a] dark:text-[#8b949e] mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider">Problems Solved</span>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-[#1f2328] dark:text-[#f0f6fc] font-mono">
                            {profile?.problemsSolved || 14}
                          </span>
                          <span className="text-xs text-[#57606a] dark:text-[#8b949e] font-medium">/ 50 Catalog</span>
                        </div>
                        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-md w-fit">
                          <span>8 Easy</span> • <span>5 Medium</span> • <span>1 Hard</span>
                        </div>
                      </div>

                      <div className="p-5 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[#57606a] dark:text-[#8b949e] mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider">Evolution Delta</span>
                          <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-[#1f2328] dark:text-[#f0f6fc] font-mono">
                            98.4%
                          </span>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.5 rounded">
                            Avg Drop
                          </span>
                        </div>
                        <p className="text-[11px] text-[#57606a] dark:text-[#8b949e] mt-2 font-medium">
                          Average latency reduction across iterations
                        </p>
                      </div>

                      <div className="p-5 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[#57606a] dark:text-[#8b949e] mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider">Total Runs</span>
                          <Code2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-[#1f2328] dark:text-[#f0f6fc] font-mono">
                            {profile?.totalSubmissions || 42}
                          </span>
                          <span className="text-xs text-[#57606a] dark:text-[#8b949e] font-medium">Isolated passes</span>
                        </div>
                        <p className="text-[11px] text-[#57606a] dark:text-[#8b949e] mt-2 font-medium">
                          cgroup kernel evaluations performed
                        </p>
                      </div>

                      <div className="p-5 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-[#57606a] dark:text-[#8b949e] mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider">Evolution Streak</span>
                          <Flame className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-[#1f2328] dark:text-[#f0f6fc] font-mono flex items-center gap-1">
                            {profile?.currentStreak || 5} <span className="text-xl">Days</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-[#57606a] dark:text-[#8b949e] mt-2 font-medium">
                          Consistent daily algorithmic mastery
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1.2 Developer Dossier Section */}
                {(infoSubTab === 'dossier' || infoSubTab === 'all') && (
                  <div className="p-6 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-[#d0d7de] dark:border-[#30363d] pb-4">
                      <div>
                        <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff]" />
                          Developer Dossier
                        </h3>
                        <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-0.5">
                          Your authenticated student profile details & active system metadata.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(true)}
                        className="px-3.5 py-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] text-xs font-semibold text-[#1f2328] dark:text-[#f0f6fc] transition cursor-pointer"
                      >
                        Edit Information
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-3.5 rounded-xl bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d]">
                        <span className="text-[#57606a] dark:text-[#8b949e] block mb-1">Full Legal Name</span>
                        <span className="font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
                          {profile?.fullName || user?.username || 'Not configured'}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d]">
                        <span className="text-[#57606a] dark:text-[#8b949e] block mb-1">Primary Email</span>
                        <span className="font-semibold text-[#1f2328] dark:text-[#f0f6fc] font-mono">
                          {user?.email || 'student@aica.dev'}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d]">
                        <span className="text-[#57606a] dark:text-[#8b949e] block mb-1">GitHub Integration</span>
                        <span className="font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
                          {profile?.githubHandle ? `@${profile.githubHandle}` : 'None linked'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1.3 Skills & Language Section */}
                {(infoSubTab === 'skills' || infoSubTab === 'all') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs space-y-5">
                      <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        Language Distribution
                      </h3>
                      <div className="h-3 w-full rounded-full bg-[#f6f8fa] dark:bg-[#21262d] flex overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: '48%' }} title="Python 48%" />
                        <div className="bg-indigo-500 h-full" style={{ width: '30%' }} title="TypeScript 30%" />
                        <div className="bg-amber-500 h-full" style={{ width: '14%' }} title="C++ 14%" />
                        <div className="bg-teal-400 h-full" style={{ width: '8%' }} title="JavaScript 8%" />
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-emerald-500" />
                          <span className="font-semibold text-[#1f2328] dark:text-[#f0f6fc]">Python</span>
                          <span className="text-[#57606a] dark:text-[#8b949e] font-mono ml-auto">48%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-indigo-500" />
                          <span className="font-semibold text-[#1f2328] dark:text-[#f0f6fc]">TypeScript</span>
                          <span className="text-[#57606a] dark:text-[#8b949e] font-mono ml-auto">30%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-amber-500" />
                          <span className="font-semibold text-[#1f2328] dark:text-[#f0f6fc]">C++</span>
                          <span className="text-[#57606a] dark:text-[#8b949e] font-mono ml-auto">14%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-teal-400" />
                          <span className="font-semibold text-[#1f2328] dark:text-[#f0f6fc]">JavaScript</span>
                          <span className="text-[#57606a] dark:text-[#8b949e] font-mono ml-auto">8%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs space-y-4">
                      <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        Mastered Algorithmic Paradigms
                      </h3>
                      <div className="flex flex-wrap gap-2 text-xs font-medium">
                        <span className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                          Hash Tables (O(1) Lookups)
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                          Two Pointers & Sliding Window
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                          Dynamic Programming (Memoization)
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                          Binary Search Trees
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] border border-[#d0d7de] dark:border-[#30363d]">
                          Monotonic Stacks & Queues
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 2: SETTINGS PANE                                         */}
            {/* ============================================================ */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Header Description */}
                <div className="border-b border-[#d0d7de] dark:border-[#30363d] pb-4">
                  <h2 className="text-base font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-[#0969da] dark:text-[#58a6ff]" />
                    Settings & Preferences
                  </h2>
                  <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-1">
                    Customize your appearance, code editor workspace, execution alerts, and security credentials.
                  </p>
                </div>

                {/* Section 1: Appearance & Workspace Theme */}
                {(settingsSubTab === 'appearance' || settingsSubTab === 'all') && (
                  <div className="p-5 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-2">
                          <Sun className="w-4 h-4 text-amber-500" />
                          Appearance & Theme
                        </h3>
                        <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-0.5">
                          Select your workspace theme mode. Synchronizes automatically with Monaco editor and system panels.
                        </p>
                      </div>
                      <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#f6f8fa] dark:bg-[#21262d] text-[#57606a] dark:text-[#8b949e] border border-[#d0d7de] dark:border-[#30363d]">
                        Active: {theme}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setTheme('light')}
                        className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 transition cursor-pointer text-left ${
                          theme === 'light'
                            ? 'border-[#0969da] dark:border-[#58a6ff] bg-[#f6f8fa] dark:bg-[#21262d] ring-1 ring-[#0969da] dark:ring-[#58a6ff]'
                            : 'border-[#d0d7de] dark:border-[#30363d] hover:border-[#8c959f] dark:hover:border-[#6e7681] bg-white dark:bg-[#0d1117]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Sun className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] block">Light Mode</span>
                            <span className="text-[10px] text-[#57606a] dark:text-[#8b949e]">Clean high-contrast theme</span>
                          </div>
                        </div>
                        {theme === 'light' && (
                          <CheckCircle2 className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff] shrink-0" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 transition cursor-pointer text-left ${
                          theme === 'dark'
                            ? 'border-[#0969da] dark:border-[#58a6ff] bg-[#f6f8fa] dark:bg-[#21262d] ring-1 ring-[#0969da] dark:ring-[#58a6ff]'
                            : 'border-[#d0d7de] dark:border-[#30363d] hover:border-[#8c959f] dark:hover:border-[#6e7681] bg-white dark:bg-[#0d1117]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <Moon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] block">Dark Mode</span>
                            <span className="text-[10px] text-[#57606a] dark:text-[#8b949e]">Low-glare IDE theme</span>
                          </div>
                        </div>
                        {theme === 'dark' && (
                          <CheckCircle2 className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff] shrink-0" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setTheme('system')}
                        className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 transition cursor-pointer text-left ${
                          theme === 'system'
                            ? 'border-[#0969da] dark:border-[#58a6ff] bg-[#f6f8fa] dark:bg-[#21262d] ring-1 ring-[#0969da] dark:ring-[#58a6ff]'
                            : 'border-[#d0d7de] dark:border-[#30363d] hover:border-[#8c959f] dark:hover:border-[#6e7681] bg-white dark:bg-[#0d1117]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                            <Laptop className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] block">System Preference</span>
                            <span className="text-[10px] text-[#57606a] dark:text-[#8b949e]">Sync with OS appearance</span>
                          </div>
                        </div>
                        {theme === 'system' && (
                          <CheckCircle2 className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff] shrink-0" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Section 2: Monaco Code Editor Configuration */}
                {(settingsSubTab === 'editor' || settingsSubTab === 'all') && (
                  <div className="p-5 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff]" />
                          Monaco Code Editor Preferences
                        </h3>
                        <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-0.5">
                          Configure typography, indentation, and visual aids for the interactive code execution workspace.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={editorPrefs.resetDefaults}
                        className="px-2.5 py-1 text-[11px] rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] transition cursor-pointer font-medium"
                      >
                        Reset Defaults
                      </button>
                    </div>

                    {/* Controls Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Font Size Selector */}
                      <div className="p-3.5 rounded-lg bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
                          <span className="flex items-center gap-1.5">
                            <Type className="w-3.5 h-3.5 text-[#57606a] dark:text-[#8b949e]" />
                            Font Size
                          </span>
                          <span className="font-mono text-[#0969da] dark:text-[#58a6ff]">{editorPrefs.fontSize}px</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[12, 14, 16].map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => editorPrefs.setFontSize(size)}
                              className={`py-1.5 px-2 rounded-md text-xs font-mono font-medium transition cursor-pointer border ${
                                editorPrefs.fontSize === size
                                  ? 'bg-white dark:bg-[#21262d] border-[#0969da] dark:border-[#58a6ff] text-[#0969da] dark:text-[#58a6ff] shadow-xs'
                                  : 'border-[#d0d7de] dark:border-[#30363d] bg-white/50 dark:bg-[#161b22]/50 text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                              }`}
                            >
                              {size}px {size === 14 ? '(Default)' : size === 12 ? '(Compact)' : '(Large)'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tab Indentation */}
                      <div className="p-3.5 rounded-lg bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
                          <span className="flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-[#57606a] dark:text-[#8b949e]" />
                            Tab Indentation
                          </span>
                          <span className="font-mono text-[#0969da] dark:text-[#58a6ff]">{editorPrefs.tabSize} spaces</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[2, 4].map((spaces) => (
                            <button
                              key={spaces}
                              type="button"
                              onClick={() => editorPrefs.setTabSize(spaces)}
                              className={`py-1.5 px-2 rounded-md text-xs font-mono font-medium transition cursor-pointer border ${
                                editorPrefs.tabSize === spaces
                                  ? 'bg-white dark:bg-[#21262d] border-[#0969da] dark:border-[#58a6ff] text-[#0969da] dark:text-[#58a6ff] shadow-xs'
                                  : 'border-[#d0d7de] dark:border-[#30363d] bg-white/50 dark:bg-[#161b22]/50 text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                              }`}
                            >
                              {spaces} Spaces {spaces === 2 ? '(Python / JS)' : '(C++ / Java)'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d]">
                        <div>
                          <span className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] block">
                            Code Minimap
                          </span>
                          <span className="text-[11px] text-[#57606a] dark:text-[#8b949e]">
                            Display an interactive code overview thumbnail in the right gutter of the workspace.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => editorPrefs.setMinimap(!editorPrefs.minimap)}
                          className={`w-10 h-5 rounded-full transition-colors p-0.5 cursor-pointer relative shrink-0 ${
                            editorPrefs.minimap ? 'bg-[#1f883d] dark:bg-[#238636]' : 'bg-[#d0d7de] dark:bg-[#30363d]'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              editorPrefs.minimap ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d]">
                        <div>
                          <span className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] block">
                            Bracket Pair Colorization
                          </span>
                          <span className="text-[11px] text-[#57606a] dark:text-[#8b949e]">
                            Colorize matching parentheses, brackets, and curly braces to quickly navigate nested loops.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => editorPrefs.setBracketPairColorization(!editorPrefs.bracketPairColorization)}
                          className={`w-10 h-5 rounded-full transition-colors p-0.5 cursor-pointer relative shrink-0 ${
                            editorPrefs.bracketPairColorization ? 'bg-[#1f883d] dark:bg-[#238636]' : 'bg-[#d0d7de] dark:bg-[#30363d]'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              editorPrefs.bracketPairColorization ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d]">
                        <div>
                          <span className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] block">
                            Word Wrap
                          </span>
                          <span className="text-[11px] text-[#57606a] dark:text-[#8b949e]">
                            Soft-wrap long lines of algorithmic logic to eliminate horizontal scrolling.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => editorPrefs.setWordWrap(editorPrefs.wordWrap === 'on' ? 'off' : 'on')}
                          className={`w-10 h-5 rounded-full transition-colors p-0.5 cursor-pointer relative shrink-0 ${
                            editorPrefs.wordWrap === 'on' ? 'bg-[#1f883d] dark:bg-[#238636]' : 'bg-[#d0d7de] dark:bg-[#30363d]'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              editorPrefs.wordWrap === 'on' ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Live Preview Box */}
                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider block mb-1.5">
                        Live Monaco Typography Preview ({editorPrefs.fontSize}px / {editorPrefs.tabSize} spaces)
                      </span>
                      <div
                        className="p-3.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] overflow-x-auto font-mono text-[#1f2328] dark:text-[#e6edf3]"
                        style={{
                          fontSize: `${editorPrefs.fontSize}px`,
                          lineHeight: '1.5',
                          tabSize: editorPrefs.tabSize
                        }}
                      >
                        <pre className="m-0 leading-relaxed font-mono">
                          <div><span className="text-[#cf222e] dark:text-[#ff7b72]">def</span> <span className="text-[#8250df] dark:text-[#d2a8ff]">merge_intervals</span>(intervals: <span className="text-[#0969da] dark:text-[#79c0ff]">list</span>[<span className="text-[#0969da] dark:text-[#79c0ff]">list</span>[<span className="text-[#0969da] dark:text-[#79c0ff]">int</span>]]):</div>
                          <div>{' '.repeat(editorPrefs.tabSize)}intervals.sort(key=<span className="text-[#cf222e] dark:text-[#ff7b72]">lambda</span> x: x[<span className="text-[#0550ae] dark:text-[#a5d6ff]">0</span>])</div>
                          <div>{' '.repeat(editorPrefs.tabSize)}merged = []</div>
                          <div>{' '.repeat(editorPrefs.tabSize)}<span className="text-[#cf222e] dark:text-[#ff7b72]">for</span> interval <span className="text-[#cf222e] dark:text-[#ff7b72]">in</span> intervals:</div>
                          <div>{' '.repeat(editorPrefs.tabSize * 2)}<span className="text-[#cf222e] dark:text-[#ff7b72]">if</span> <span className="text-[#cf222e] dark:text-[#ff7b72]">not</span> merged <span className="text-[#cf222e] dark:text-[#ff7b72]">or</span> merged[-<span className="text-[#0550ae] dark:text-[#a5d6ff]">1</span>][<span className="text-[#0550ae] dark:text-[#a5d6ff]">1</span>] &lt; interval[<span className="text-[#0550ae] dark:text-[#a5d6ff]">0</span>]:</div>
                          <div>{' '.repeat(editorPrefs.tabSize * 3)}merged.append(interval)</div>
                          <div>{' '.repeat(editorPrefs.tabSize * 2)}<span className="text-[#cf222e] dark:text-[#ff7b72]">else</span>:</div>
                          <div>{' '.repeat(editorPrefs.tabSize * 3)}merged[-<span className="text-[#0550ae] dark:text-[#a5d6ff]">1</span>][<span className="text-[#0550ae] dark:text-[#a5d6ff]">1</span>] = max(merged[-<span className="text-[#0550ae] dark:text-[#a5d6ff]">1</span>][<span className="text-[#0550ae] dark:text-[#a5d6ff]">1</span>], interval[<span className="text-[#0550ae] dark:text-[#a5d6ff]">1</span>])</div>
                          <div>{' '.repeat(editorPrefs.tabSize)}<span className="text-[#cf222e] dark:text-[#ff7b72]">return</span> merged</div>
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 3: Notification Preferences */}
                {(settingsSubTab === 'notifications' || settingsSubTab === 'all') && (
                  <div className="p-5 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#1a7f37] dark:text-[#3fb950]" />
                        Notification Preferences
                      </h3>
                      <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-0.5">
                        Configure alerts for code evaluation results and daily algorithmic streak goals.
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d]">
                        <div>
                          <span className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] block">
                            Real-Time Test Verdict Alerts
                          </span>
                          <span className="text-[11px] text-[#57606a] dark:text-[#8b949e]">
                            Receive immediate notifications when Judge0 completes your submission.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNotifyVerdicts(!notifyVerdicts)}
                          className={`w-10 h-5 rounded-full transition-colors p-0.5 cursor-pointer relative shrink-0 ${
                            notifyVerdicts ? 'bg-[#1f883d] dark:bg-[#238636]' : 'bg-[#d0d7de] dark:bg-[#30363d]'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              notifyVerdicts ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d]">
                        <div>
                          <span className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] block">
                            Daily Streak Reminders
                          </span>
                          <span className="text-[11px] text-[#57606a] dark:text-[#8b949e]">
                            Get a gentle reminder if you have not submitted code today.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNotifyStreaks(!notifyStreaks)}
                          className={`w-10 h-5 rounded-full transition-colors p-0.5 cursor-pointer relative shrink-0 ${
                            notifyStreaks ? 'bg-[#1f883d] dark:bg-[#238636]' : 'bg-[#d0d7de] dark:bg-[#30363d]'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              notifyStreaks ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d]">
                        <div>
                          <span className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] block">
                            AI Pedagogical Suggestions
                          </span>
                          <span className="text-[11px] text-[#57606a] dark:text-[#8b949e]">
                            Automated complexity analysis and code evolution optimization digests.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNotifyDigest(!notifyDigest)}
                          className={`w-10 h-5 rounded-full transition-colors p-0.5 cursor-pointer relative shrink-0 ${
                            notifyDigest ? 'bg-[#1f883d] dark:bg-[#238636]' : 'bg-[#d0d7de] dark:bg-[#30363d]'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform ${
                              notifyDigest ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 4: Change Password */}
                {(settingsSubTab === 'security' || settingsSubTab === 'all') && (
                  <div className="p-5 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-[#8250df] dark:text-[#a371f7]" />
                        Change Password
                      </h3>
                      <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-0.5">
                        Ensure your account security with a strong passphrase containing uppercase, lowercase, and numbers.
                      </p>
                    </div>

                    {passwordStatus && (
                      <div
                        className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                          passwordStatus.type === 'success'
                            ? 'bg-[#dafbe1] dark:bg-[#2ea04326] border border-[#4ac26b66] dark:border-[#2ea0434d] text-[#1a7f37] dark:text-[#3fb950]'
                            : 'bg-[#ffebe9] dark:bg-[#f851491a] border border-[#ff818266] dark:border-[#f851494d] text-[#cf222e] dark:text-[#f85149]'
                        }`}
                      >
                        {passwordStatus.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 shrink-0" />
                        )}
                        <span>{passwordStatus.message}</span>
                      </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-3.5 max-w-lg text-xs font-medium pt-1">
                      <div>
                        <label className="block text-[#1f2328] dark:text-[#e6edf3] mb-1 font-semibold">
                          Current Password
                        </label>
                        <input
                          type="password"
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="w-full px-3 py-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-[#1f2328] dark:text-[#e6edf3] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[#1f2328] dark:text-[#e6edf3] mb-1 font-semibold">
                          New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 8 characters"
                          className="w-full px-3 py-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-[#1f2328] dark:text-[#e6edf3] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[#1f2328] dark:text-[#e6edf3] mb-1 font-semibold">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repeat new password"
                          className="w-full px-3 py-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-[#1f2328] dark:text-[#e6edf3] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={updatingPassword}
                        className="px-4 py-2 rounded-lg bg-[#1f883d] dark:bg-[#238636] hover:bg-[#1a7f37] dark:hover:bg-[#2ea043] text-white font-semibold transition disabled:opacity-60 cursor-pointer shadow-xs"
                      >
                        {updatingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 3: ACTIVITY & BADGES PANE                                */}
            {/* ============================================================ */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                {/* 3.1 52-Week Heatmap */}
                {(activitySubTab === 'heatmap' || activitySubTab === 'all') && (
                  <div className="p-6 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                          Annual Evaluation Activity
                        </h2>
                        <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-0.5">
                          42 kernel evaluations and submissions across past months
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#57606a] dark:text-[#8b949e] font-medium">
                        <span>Less</span>
                        <span className="w-2.5 h-2.5 rounded-xs bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d]" />
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-200 dark:bg-emerald-800" />
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-400 dark:bg-emerald-600" />
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 dark:bg-emerald-500" />
                        <span>More</span>
                      </div>
                    </div>

                    {/* Heatmap Grid */}
                    <div className="overflow-x-auto pb-2">
                      <div className="flex gap-1 min-w-[640px]">
                        {heatmapWeeks.map((week, wIdx) => (
                          <div key={wIdx} className="flex flex-col gap-1">
                            {week.map((level, dIdx) => {
                              const bgClass =
                                level === 0
                                  ? 'bg-[#f6f8fa] dark:bg-[#21262d] hover:bg-[#eaeef2] dark:hover:bg-[#30363d]'
                                  : level === 1
                                  ? 'bg-emerald-200 dark:bg-emerald-800 hover:bg-emerald-300 dark:hover:bg-emerald-700'
                                  : level === 2
                                  ? 'bg-emerald-400 dark:bg-emerald-600 hover:bg-emerald-500 dark:hover:bg-emerald-500'
                                  : 'bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-400';

                              return (
                                <div
                                  key={dIdx}
                                  className={`w-3 h-3 rounded-xs ${bgClass} transition-colors cursor-pointer`}
                                  title={`Activity intensity: Level ${level}`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3.2 Evolution History & Recent Submissions */}
                {(activitySubTab === 'submissions' || activitySubTab === 'all') && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                        Recent Algorithmic Evolutions ({SAMPLE_EVOLUTIONS.length})
                      </h3>

                      {SAMPLE_EVOLUTIONS.length > 0 ? (
                        SAMPLE_EVOLUTIONS.map((evo) => (
                          <div
                            key={evo.id}
                            className="p-5 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs hover:border-[#8c959f] dark:hover:border-[#6e7681] transition space-y-4"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-base text-[#1f2328] dark:text-[#f0f6fc]">
                                  {evo.problemTitle}
                                </span>
                                <span
                                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                                    evo.difficulty === 'Easy'
                                      ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
                                      : evo.difficulty === 'Medium'
                                      ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60'
                                      : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60'
                                  }`}
                                >
                                  {evo.difficulty}
                                </span>
                                <span className="text-xs font-mono text-[#57606a] dark:text-[#8b949e] bg-[#f6f8fa] dark:bg-[#21262d] px-2 py-0.5 rounded">
                                  {evo.language}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-[#57606a] dark:text-[#8b949e]">
                                <span>{evo.date}</span>
                                <Link
                                  to={`/workspace/${evo.problemId}`}
                                  className="font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1"
                                >
                                  Open Workspace
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>

                            {/* Latency & Memory Transition Ribbon */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d]">
                              <div>
                                <span className="text-[11px] text-[#57606a] dark:text-[#8b949e] block mb-1">
                                  Execution Speedup
                                </span>
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-slate-400 line-through font-mono text-xs">
                                    {evo.initialRuntimeMs}ms
                                  </span>
                                  <span className="text-slate-400">&rarr;</span>
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                                    {evo.optimalRuntimeMs}ms
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1 rounded ml-1">
                                    +{evo.speedupPercent}%
                                  </span>
                                </div>
                              </div>

                              <div>
                                <span className="text-[11px] text-[#57606a] dark:text-[#8b949e] block mb-1">
                                  Peak Resident Memory
                                </span>
                                <div className="flex items-baseline gap-1.5 font-mono text-xs">
                                  <span className="text-[#1f2328] dark:text-[#f0f6fc]">
                                    {evo.optimalMemoryMb} MB
                                  </span>
                                  <span className="text-[10px] text-[#57606a] dark:text-[#8b949e]">(Heap)</span>
                                </div>
                              </div>

                              <div>
                                <span className="text-[11px] text-[#57606a] dark:text-[#8b949e] block mb-1">
                                  Gemini AST Verdict
                                </span>
                                <p className="text-xs text-[#1f2328] dark:text-[#f0f6fc] font-medium leading-relaxed truncate">
                                  {evo.pedagogicalVerdict}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : null}
                    </div>

                    {realSubmissions.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                          Recent Submissions ({realSubmissions.length})
                        </h3>
                        {realSubmissions.map((sub: any) => {
                          const isAccepted = sub.verdict === 'ACCEPTED';
                          const dateStr = new Date(sub.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });

                          return (
                            <div
                              key={sub.id}
                              className="p-5 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs hover:border-[#8c959f] dark:hover:border-[#6e7681] transition space-y-4"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-base text-[#1f2328] dark:text-[#f0f6fc]">
                                    {sub.problemTitle || 'Challenge Solution'}
                                  </span>
                                  <span
                                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                                      isAccepted
                                        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
                                        : 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60'
                                    }`}
                                  >
                                    {sub.verdict}
                                  </span>
                                  <span className="text-xs font-mono text-[#57606a] dark:text-[#8b949e] bg-[#f6f8fa] dark:bg-[#21262d] px-2 py-0.5 rounded uppercase">
                                    {sub.language}
                                  </span>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-[#57606a] dark:text-[#8b949e]">
                                  <span>{dateStr}</span>
                                  <Link
                                    to={`/workspace/${sub.problemId}`}
                                    className="font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1"
                                  >
                                    Open Workspace
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                </div>
                              </div>

                              {/* Execution Metrics Ribbon */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3.5 rounded-lg bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] text-xs">
                                <div>
                                  <span className="text-[11px] text-[#57606a] dark:text-[#8b949e] block mb-1">
                                    Execution Latency
                                  </span>
                                  <span className="font-mono font-extrabold text-[#1f2328] dark:text-[#f0f6fc]">
                                    {sub.executionTimeMs != null ? `${sub.executionTimeMs}ms` : '--'}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-[11px] text-[#57606a] dark:text-[#8b949e] block mb-1">
                                    Peak Memory Footprint
                                  </span>
                                  <span className="font-mono font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
                                    {sub.memoryUsedKb != null ? `${Math.round(sub.memoryUsedKb / 1024)} MB` : '--'}
                                  </span>
                                </div>

                                <div>
                                  <span className="text-[11px] text-[#57606a] dark:text-[#8b949e] block mb-1">
                                    Composite Quality Score
                                  </span>
                                  <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    {sub.compositeScore != null ? `${sub.compositeScore} / 100` : 'Evaluated'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3.3 Mastery Badges Grid */}
                {(activitySubTab === 'badges' || activitySubTab === 'all') && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                      Mastery Badges ({BADGES.filter((b) => b.unlocked).length}/{BADGES.length})
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {BADGES.map((badge) => {
                        const IconComponent = badge.icon;
                        return (
                          <div
                            key={badge.id}
                            className={`p-5 rounded-xl border transition flex items-start gap-4 ${
                              badge.unlocked
                                ? 'bg-white dark:bg-[#161b22] border-[#d0d7de] dark:border-[#30363d] shadow-xs hover:border-emerald-400 dark:hover:border-emerald-500'
                                : 'bg-[#f6f8fa]/50 dark:bg-[#161b22]/40 border-dashed border-[#d0d7de] dark:border-[#30363d] opacity-60'
                            }`}
                          >
                            <div
                              className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${badge.color} text-white flex items-center justify-center shrink-0 shadow-xs`}
                            >
                              <IconComponent className="w-6 h-6" />
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                                  {badge.name}
                                </h4>
                                {badge.unlocked && (
                                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.5 rounded">
                                    Unlocked
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#57606a] dark:text-[#8b949e] leading-relaxed">
                                {badge.description}
                              </p>
                              <span className="text-[10px] font-mono text-[#57606a] dark:text-[#8b949e] block pt-1">
                                {badge.earnedAt}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 4: LOGOUT CONFIRMATION PANE                              */}
            {/* ============================================================ */}
            {activeTab === 'logout' && (
              <div className="max-w-xl p-6 sm:p-8 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xl space-y-6 text-center">
                <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/50 text-[#cf222e] dark:text-[#f85149] flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900">
                  <LogOut className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                    Log Out of AI Code Lab?
                  </h3>
                  <p className="text-xs text-[#57606a] dark:text-[#8b949e] max-w-md mx-auto leading-relaxed">
                    You are currently signed in as <strong className="text-[#1f2328] dark:text-[#f0f6fc]">@{user?.username}</strong> ({user?.email}).
                    Logging out will clear your session on this device. Your algorithmic submissions, streak, and evolution history remain securely preserved.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleTabSelect('info')}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] text-xs font-semibold text-[#1f2328] dark:text-[#f0f6fc] transition cursor-pointer"
                  >
                    Stay Logged In
                  </button>
                  <button
                    type="button"
                    onClick={handleLogoutConfirm}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#cf222e] dark:bg-[#da3633] hover:bg-[#a40e26] dark:hover:bg-[#f85149] active:scale-98 text-white text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    Confirm Log Out
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 5. EDIT PROFILE MODAL                                              */}
      {/* ================================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              Edit Developer Profile
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Update your public persona, bio, and social connections.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
                {errorMsg}
              </div>
            )}

            {saveSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Profile updated successfully!
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Mohan Kunjam"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief summary of your algorithmic focus..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">GitHub Username</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400">@</span>
                  <input
                    type="text"
                    value={githubHandle}
                    onChange={(e) => setGithubHandle(e.target.value)}
                    placeholder="github_username"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 dark:text-slate-300">Avatar Image URL</label>
                  <button
                    type="button"
                    onClick={handleRandomAvatar}
                    className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Generate Random Avatar
                  </button>
                </div>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900 dark:text-slate-100 font-mono text-[11px]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-semibold transition disabled:opacity-60 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
