import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  ArrowRight,
  Tag,
  Bot,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  RotateCcw,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Clock,
  Plus,
  Zap,
  Flame,
  Trophy,
  Sparkles,
  Circle,
  TrendingUp,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Code2,
  Copy,
  Check,
  X,
  Compass,
  Layers,
  Award,
  ShieldCheck,
  CheckCheck
} from 'lucide-react';
import { ProblemListItem, ProblemDifficulty, ProblemSortOption } from '@aica/shared';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useDataCacheStore } from '../store/useDataCacheStore';
import { useDebounce } from '../hooks';

export type ProblemHubTab = 'all' | 'solved' | 'pending' | 'new' | 'tracks';
export type ViewMode = 'table' | 'grid';

interface CuratedTrack {
  id: string;
  title: string;
  description: string;
  primaryTag: string;
  tags: string[];
  icon: React.ElementType;
  colorScheme: {
    bg: string;
    border: string;
    text: string;
    badgeBg: string;
  };
}

const CURATED_TRACKS: CuratedTrack[] = [
  {
    id: 'two-pointers',
    title: 'Two Pointers & Sliding Window',
    description: 'Master fast-slow pointer scans, palindrome tests, geometric storage, and monotonic subarray windows.',
    primaryTag: 'Two-Pointers',
    tags: ['Two-Pointers', 'Sliding-Window', 'Arrays'],
    icon: TrendingUp,
    colorScheme: {
      bg: 'bg-blue-50/50 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-800/60',
      text: 'text-blue-700 dark:text-blue-400',
      badgeBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
    }
  },
  {
    id: 'binary-search',
    title: 'Binary Search & Logarithmic Bounds',
    description: 'Logarithmic search spaces, rotated sorted arrays, peak detection, and discrete monotonic bisection predicates.',
    primaryTag: 'Binary-Search',
    tags: ['Binary-Search', 'Divide-and-Conquer'],
    icon: Compass,
    colorScheme: {
      bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
      border: 'border-emerald-200 dark:border-emerald-800/60',
      text: 'text-emerald-700 dark:text-emerald-400',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300'
    }
  },
  {
    id: 'trees-graphs',
    title: 'Trees, Graphs & Recursive Traversals',
    description: 'Binary tree recursion, level-order BFS, depth-first backtracking, lowest common ancestors, and topological ordering.',
    primaryTag: 'Trees',
    tags: ['Trees', 'Breadth-First Search', 'Depth-First Search'],
    icon: Layers,
    colorScheme: {
      bg: 'bg-purple-50/50 dark:bg-purple-950/20',
      border: 'border-purple-200 dark:border-purple-800/60',
      text: 'text-purple-700 dark:text-purple-400',
      badgeBg: 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300'
    }
  },
  {
    id: 'dynamic-programming',
    title: 'Dynamic Programming & Memoization',
    description: 'Formulate state transitions, identify optimal substructure, and solve 1D/2D memoization and knapsack variants.',
    primaryTag: 'Dynamic-Programming',
    tags: ['Dynamic-Programming', 'Memoization'],
    icon: Zap,
    colorScheme: {
      bg: 'bg-amber-50/50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-800/60',
      text: 'text-amber-700 dark:text-amber-400',
      badgeBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
    }
  },
  {
    id: 'hash-strings',
    title: 'Hash Maps & String Algorithms',
    description: 'Constant-time frequency lookups, rolling hash patterns, anagram group clustering, and substring searches.',
    primaryTag: 'Hash-Table',
    tags: ['Hash-Table', 'Strings'],
    icon: Tag,
    colorScheme: {
      bg: 'bg-rose-50/50 dark:bg-rose-950/20',
      border: 'border-rose-200 dark:border-rose-800/60',
      text: 'text-rose-700 dark:text-rose-400',
      badgeBg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-300'
    }
  },
  {
    id: 'greedy-sorting',
    title: 'Greedy Heuristics & Interval Scheduling',
    description: 'Local optimal choice heuristics, non-overlapping intervals, interval merging, and sorting optimizations.',
    primaryTag: 'Greedy',
    tags: ['Greedy', 'Sorting'],
    icon: Award,
    colorScheme: {
      bg: 'bg-teal-50/50 dark:bg-teal-950/20',
      border: 'border-teal-200 dark:border-teal-800/60',
      text: 'text-teal-700 dark:text-teal-400',
      badgeBg: 'bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300'
    }
  }
];

const TOPIC_TAGS = [
  'All Topics',
  'Arrays',
  'Strings',
  'Hash-Table',
  'Two-Pointers',
  'Sliding-Window',
  'Greedy',
  'Dynamic-Programming',
  'Binary-Search',
  'Trees'
];

const TOPIC_COUNTS: Record<string, number> = {
  Arrays: 16,
  Strings: 12,
  'Hash-Table': 10,
  'Two-Pointers': 8,
  'Sliding-Window': 6,
  'Dynamic-Programming': 8,
  Greedy: 6,
  'Binary-Search': 5,
  Trees: 7
};

const SORT_OPTIONS: { label: string; value: ProblemSortOption }[] = [
  { label: 'Latest Added', value: 'latest' },
  { label: 'Difficulty: Easy to Hard', value: 'difficulty_asc' },
  { label: 'Difficulty: Hard to Easy', value: 'difficulty_desc' },
  { label: 'Title: A to Z', value: 'title_asc' }
];

export function ProblemListPage() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  // Hub View States
  const [activeTab, setActiveTab] = useState<ProblemHubTab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Solution Code Preview Modal State
  const [codeModal, setCodeModal] = useState<{
    isOpen: boolean;
    title: string;
    code: string;
    runtime?: number;
    memory?: number;
  } | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Catalog State
  const [problems, setProblems] = useState<ProblemListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);
  const [difficulty, setDifficulty] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('All Topics');
  const [sortBy, setSortBy] = useState<ProblemSortOption>('latest');

  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Reset to page 1 whenever tab or debounced search changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, debouncedSearch]);

  // Keyboard shortcut: Press "/" or "Ctrl+K" to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === '/' && document.activeElement !== searchInputRef.current) ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch problems when filters, tab, or pagination change
  useEffect(() => {
    if (activeTab === 'tracks') {
      setLoading(false);
      return;
    }
    fetchProblems();
  }, [page, difficulty, selectedTag, sortBy, debouncedSearch, activeTab]);

  const fetchProblems = async () => {
    const cacheKey = `hub_${page}_${difficulty}_${selectedTag}_${sortBy}_${debouncedSearch}_${activeTab}_${user?.id || 'guest'}`;
    const cached = useDataCacheStore.getState().get<{ problems: ProblemListItem[]; pagination: any }>(cacheKey);

    if (cached) {
      setProblems(cached.problems);
      if (cached.pagination) setPagination(cached.pagination);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page,
        limit: 15,
        sortBy
      };

      if (difficulty !== 'ALL') params.difficulty = difficulty;
      if (selectedTag !== 'All Topics') params.tag = selectedTag;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      // Map active hub tab to backend statusFilter
      if (activeTab === 'solved') {
        params.statusFilter = 'SOLVED';
      } else if (activeTab === 'pending') {
        params.statusFilter = 'ATTEMPTED';
      } else if (activeTab === 'new') {
        params.statusFilter = 'TODO';
      }

      const res = await api.get('/problems', { params });
      const data = res.data.data;
      const fetchedProblems = data.problems || [];
      const fetchedPagination = data.pagination || null;

      setProblems(fetchedProblems);
      if (fetchedPagination) {
        setPagination(fetchedPagination);
      }

      useDataCacheStore.getState().set(cacheKey, {
        problems: fetchedProblems,
        pagination: fetchedPagination
      });
    } catch (err: any) {
      console.warn('[ProblemHub] Failed to fetch problems:', err.message);
      setError('Unable to load problems from catalog. Please verify your connection.');
      setProblems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setDifficulty('ALL');
    setSelectedTag('All Topics');
    setSortBy('latest');
    setPage(1);
  };

  const handleTrackSelect = (track: CuratedTrack) => {
    setSelectedTag(track.primaryTag);
    setActiveTab('all');
    setPage(1);
  };

  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const getDifficultyBadge = (diff: ProblemDifficulty) => {
    switch (diff) {
      case 'EASY':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#dafbe1] dark:bg-[#2ea04326] text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b66] dark:border-[#2ea0434d]">
            Easy
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#fff8c5] dark:bg-[#bb800926] text-[#9a6700] dark:text-[#d29922] border border-[#d4a72c66] dark:border-[#bb80094d]">
            Medium
          </span>
        );
      case 'HARD':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#ffebe9] dark:bg-[#f8514926] text-[#cf222e] dark:text-[#f85149] border border-[#ff818266] dark:border-[#f851494d]">
            Hard
          </span>
        );
    }
  };

  const isFiltered =
    difficulty !== 'ALL' ||
    selectedTag !== 'All Topics' ||
    search.trim() !== '' ||
    sortBy !== 'latest';

  const solvedCount = profile?.problemsSolved ?? 14;
  const totalCatalog = 50;
  const progressPercent = Math.round((solvedCount / totalCatalog) * 100);

  return (
    <div className="flex-1 bg-[#f6f8fa] dark:bg-[#010409] text-[#1f2328] dark:text-[#e6edf3] pb-16 transition-colors duration-200">
      {/* ================================================================== */}
      {/* 1. TOP CONTEXT HEADER & DASHBOARD PILLS                            */}
      {/* ================================================================== */}
      <div className="bg-white dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d] py-5 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#0969da]/10 dark:bg-[#58a6ff]/15 text-[#0969da] dark:text-[#58a6ff]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1f2328] dark:text-[#f0f6fc]">
                  Problem Hub & Learning Pathways
                </h1>
              </div>
              <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-1">
                Explore curated algorithmic challenges, track personal execution benchmarks, and master computational patterns.
              </p>
            </div>

            {/* Quick Metrics Bar & Staff Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Staff Actions (Admin & Instructor only) */}
              {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
                <div className="flex items-center gap-2 mr-2 border-r border-[#d0d7de] dark:border-[#30363d] pr-3">
                  <Link
                    to="/admin/problems?create=true"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Problem</span>
                  </Link>
                  <Link
                    to="/create-problem"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] text-xs font-semibold transition cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5 text-[#8250df] dark:text-[#a371f7]" />
                    <span>AI Studio</span>
                  </Link>
                </div>
              )}

              {/* View Mode Toggle */}
              <div className="inline-flex rounded-lg p-0.5 bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d]">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-[#21262d] text-[#0969da] dark:text-[#58a6ff] shadow-xs'
                      : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                  }`}
                  title="Table View (High-Density)"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-[#21262d] text-[#0969da] dark:text-[#58a6ff] shadow-xs'
                      : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                  }`}
                  title="Grid View (Bento Cards)"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 5 SMART SEGMENTED TABS                                         */}
          {/* ============================================================== */}
          <div className="flex items-center gap-2 mt-5 overflow-x-auto pb-1 border-b border-[#d0d7de]/70 dark:border-[#30363d]">
            {[
              { id: 'all', label: 'Explore All', icon: BookOpen, count: pagination.total || totalCatalog },
              { id: 'solved', label: 'Solved Questions', icon: CheckCircle2, badgeColor: 'text-[#1a7f37] dark:text-[#3fb950]' },
              { id: 'pending', label: 'In-Progress / Pending', icon: Clock, badgeColor: 'text-[#9a6700] dark:text-[#d29922]' },
              { id: 'new', label: 'New & Fresh', icon: Sparkles, badgeColor: 'text-indigo-600 dark:text-indigo-400' },
              { id: 'tracks', label: 'Algorithm Tracks', icon: Award, badgeColor: 'text-[#8250df] dark:text-[#a371f7]' }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as ProblemHubTab);
                    setPage(1);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                    isActive
                      ? 'border-[#0969da] text-[#0969da] dark:text-[#58a6ff] dark:border-[#58a6ff] bg-[#f6f8fa]/80 dark:bg-[#21262d]/50'
                      : 'border-transparent text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] hover:border-[#d0d7de] dark:hover:border-[#30363d]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${tab.badgeColor || ''}`} />
                  <span>{tab.label}</span>
                  {tab.id === 'all' && pagination.total > 0 && (
                    <span className="ml-0.5 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#848d97]">
                      {pagination.total}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. MAIN 2-PANE CATALOG GRID (12 Columns)                           */}
      {/* ================================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ============================================================== */}
          {/* LEFT COLUMN: ACTIVE VIEW (8-9 Cols)                            */}
          {/* ============================================================== */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-4 min-w-0">
            {/* If Algorithm Tracks Tab is Active, render Tracks Showcase */}
            {activeTab === 'tracks' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs">
                  <h2 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#8250df] dark:text-[#a371f7]" />
                    Curated Algorithmic Pathways & Skill Tracks
                  </h2>
                  <p className="text-xs text-[#656d76] dark:text-[#8b949e] mt-1 leading-relaxed">
                    Select a structured curriculum track to practice core coding interview patterns sequentially from fundamentals to advanced edge cases.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CURATED_TRACKS.map((track) => {
                    const TrackIcon = track.icon;
                    return (
                      <div
                        key={track.id}
                        className={`rounded-xl border p-4.5 transition-all shadow-xs hover:shadow-md flex flex-col justify-between ${track.colorScheme.bg} ${track.colorScheme.border}`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="p-2 rounded-lg bg-white dark:bg-[#161b22] border border-[#d0d7de]/60 dark:border-[#30363d] shadow-xs">
                              <TrackIcon className={`w-5 h-5 ${track.colorScheme.text}`} />
                            </div>
                            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${track.colorScheme.badgeBg}`}>
                              Track
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] mt-3">
                            {track.title}
                          </h3>
                          <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-1.5 leading-relaxed">
                            {track.description}
                          </p>

                          {/* Related tags */}
                          <div className="flex flex-wrap gap-1 mt-3">
                            {track.tags.map((t) => (
                              <span
                                key={t}
                                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/80 dark:bg-[#161b22]/80 text-[#57606a] dark:text-[#8b949e] border border-[#d0d7de]/50 dark:border-[#30363d]"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#d0d7de]/40 dark:border-[#30363d]/60 flex items-center justify-between">
                          <button
                            onClick={() => handleTrackSelect(track)}
                            className="w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer bg-white dark:bg-[#161b22] hover:bg-[#0969da] hover:text-white dark:hover:bg-[#2ea043] border border-[#d0d7de] dark:border-[#30363d] text-[#1f2328] dark:text-[#f0f6fc] shadow-2xs group"
                          >
                            <span>Explore Track Challenges</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {/* Unified Filter & Search Bar */}
                <div className="p-3 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    {/* Search input with keyboard hint */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-[#8c959f] dark:text-[#6e7681] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search problems by title, keywords or tags... (Press '/' to focus)"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-14 py-2 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] text-xs text-[#1f2328] dark:text-[#f0f6fc] placeholder-[#8c959f] dark:placeholder-[#6e7681] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] outline-none transition"
                      />
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#848d97] shadow-2xs">
                          /
                        </kbd>
                      </div>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="relative shrink-0">
                      <select
                        value={sortBy}
                        onChange={(e) => {
                          setSortBy(e.target.value as ProblemSortOption);
                          setPage(1);
                        }}
                        className="appearance-none bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] text-xs font-semibold text-[#1f2328] dark:text-[#f0f6fc] rounded-lg pl-8 pr-7 py-2 focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] outline-none cursor-pointer"
                      >
                        {SORT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ArrowUpDown className="w-3.5 h-3.5 text-[#8c959f] dark:text-[#6e7681] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {isFiltered && (
                      <button
                        onClick={handleClearFilters}
                        className="flex items-center gap-1 px-2.5 py-2 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] text-xs font-medium text-[#656d76] dark:text-[#848d97] hover:text-[#cf222e] dark:hover:text-[#f85149] transition cursor-pointer shrink-0"
                        title="Reset all filters"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>

                  {/* Segmented Difficulty Pills & Topic Selector */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#d0d7de]/60 dark:border-[#30363d]/80 text-xs">
                    {/* Segmented Difficulty Bar */}
                    <div className="inline-flex rounded-lg p-0.5 bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d]">
                      {[
                        { id: 'ALL', label: 'All Difficulties' },
                        { id: 'EASY', label: 'Easy' },
                        { id: 'MEDIUM', label: 'Medium' },
                        { id: 'HARD', label: 'Hard' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setDifficulty(tab.id);
                            setPage(1);
                          }}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                            difficulty === tab.id
                              ? 'bg-white dark:bg-[#21262d] text-[#0969da] dark:text-[#58a6ff] shadow-xs'
                              : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Selected Topic Badge / Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-[#656d76] dark:text-[#848d97] text-[11px] font-medium hidden sm:inline">
                        Filter by Topic:
                      </span>
                      <select
                        value={selectedTag}
                        onChange={(e) => {
                          setSelectedTag(e.target.value);
                          setPage(1);
                        }}
                        className="bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] text-xs font-semibold text-[#1f2328] dark:text-[#f0f6fc] rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] outline-none cursor-pointer"
                      >
                        {TOPIC_TAGS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Loading / Error States */}
                {loading ? (
                  <div className="p-16 text-center space-y-3 bg-white dark:bg-[#161b22] rounded-xl border border-[#d0d7de] dark:border-[#30363d]">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0969da] dark:text-[#58a6ff] mx-auto" />
                    <p className="text-xs font-mono text-[#656d76] dark:text-[#848d97]">
                      Loading catalog challenges...
                    </p>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center space-y-3 bg-white dark:bg-[#161b22] rounded-xl border border-[#d0d7de] dark:border-[#30363d]">
                    <AlertCircle className="w-7 h-7 text-[#cf222e] dark:text-[#f85149] mx-auto" />
                    <p className="text-[#1f2328] dark:text-[#f0f6fc] font-semibold text-xs">{error}</p>
                    <button
                      onClick={fetchProblems}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0969da] text-white hover:bg-[#0854b0] transition cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                ) : problems.length === 0 ? (
                  <div className="p-16 text-center space-y-3 bg-white dark:bg-[#161b22] rounded-xl border border-[#d0d7de] dark:border-[#30363d]">
                    <BookOpen className="w-8 h-8 text-[#8c959f] dark:text-[#6e7681] mx-auto" />
                    <p className="text-[#1f2328] dark:text-[#f0f6fc] font-bold text-sm">
                      {activeTab === 'solved'
                        ? 'No solved challenges yet'
                        : activeTab === 'pending'
                        ? 'No in-progress challenges found'
                        : 'No matching problems found'}
                    </p>
                    <p className="text-[#656d76] dark:text-[#848d97] text-xs max-w-sm mx-auto">
                      {activeTab === 'solved'
                        ? 'Start solving problems from the "Explore All" tab to build your verified solution dossier!'
                        : 'Try adjusting your keyword search, difficulty, or topic filter.'}
                    </p>
                    {isFiltered && (
                      <button
                        onClick={handleClearFilters}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-[#1f2328] dark:text-[#f0f6fc] hover:bg-[#eaeef2] transition cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Clear Filters
                      </button>
                    )}
                  </div>
                ) : viewMode === 'grid' ? (
                  /* ========================================================== */
                  /* BENTO GRID VIEW (Card View)                                */
                  /* ========================================================== */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {problems.map((prob, idx) => (
                      <div
                        key={prob.id}
                        className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-xl p-4.5 hover:border-[#0969da] dark:hover:border-[#58a6ff] hover:shadow-sm transition group flex flex-col justify-between"
                      >
                        <div>
                          {/* Top Status & Difficulty Row */}
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            {prob.userStatus === 'SOLVED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dafbe1] dark:bg-[#2ea04326] text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b66] dark:border-[#2ea0434d]">
                                <CheckCircle2 className="w-3 h-3" /> Solved
                              </span>
                            ) : prob.userStatus === 'ATTEMPTED' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fff8c5] dark:bg-[#bb800926] text-[#9a6700] dark:text-[#d29922] border border-[#d4a72c66] dark:border-[#bb80094d]">
                                <Clock className="w-3 h-3" /> In-Progress
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97] border border-[#d0d7de] dark:border-[#30363d]">
                                <Sparkles className="w-3 h-3 text-indigo-500" /> New
                              </span>
                            )}

                            {getDifficultyBadge(prob.difficulty)}
                          </div>

                          {/* Problem Title */}
                          <Link
                            to={`/workspace/${prob.slug || prob.id}`}
                            className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff] transition line-clamp-2"
                          >
                            <span className="font-mono text-[#656d76] dark:text-[#848d97] text-xs mr-1.5">
                              {(page - 1) * pagination.limit + idx + 1}.
                            </span>
                            {prob.title}
                          </Link>

                          {/* Personal Metrics Annotation */}
                          {prob.userStatus === 'SOLVED' && prob.bestRuntimeMs !== undefined && (
                            <div className="mt-2 text-[11px] font-mono text-[#1a7f37] dark:text-[#3fb950] flex items-center gap-2">
                              <span className="flex items-center gap-1">
                                <Zap className="w-3 h-3" /> Best: {prob.bestRuntimeMs}ms
                              </span>
                              {prob.bestMemoryKb ? <span>• {Math.round(prob.bestMemoryKb / 1024)} MB</span> : null}
                            </div>
                          )}

                          {prob.userStatus === 'ATTEMPTED' && prob.lastVerdict && (
                            <div className="mt-2 text-[11px] font-mono text-[#cf222e] dark:text-[#f85149] flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>Last Error: {prob.lastVerdict.replace(/_/g, ' ')}</span>
                            </div>
                          )}

                          {/* Tags */}
                          <div className="flex flex-wrap gap-1 mt-3">
                            {prob.tags.slice(0, 3).map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  setSelectedTag(t);
                                  setPage(1);
                                }}
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#f6f8fa] dark:bg-[#0d1117] text-[#656d76] dark:text-[#848d97] border border-[#d0d7de]/70 dark:border-[#30363d] hover:border-[#0969da] transition cursor-pointer"
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Card Bottom Actions */}
                        <div className="mt-4 pt-3 border-t border-[#d0d7de]/60 dark:border-[#30363d] flex items-center justify-between">
                          <span className="text-[11px] font-mono text-[#656d76] dark:text-[#848d97]">
                            {prob.acceptanceRate ? `${prob.acceptanceRate}%` : '58%'} pass • {prob.totalSubmissions || 24} runs
                          </span>

                          <div className="flex items-center gap-1.5">
                            {prob.solutionCode && (
                              <button
                                onClick={() =>
                                  setCodeModal({
                                    isOpen: true,
                                    title: prob.title,
                                    code: prob.solutionCode!,
                                    runtime: prob.bestRuntimeMs,
                                    memory: prob.bestMemoryKb
                                  })
                                }
                                className="p-1.5 rounded-md hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] text-[#656d76] dark:text-[#848d97] hover:text-[#0969da] dark:hover:text-[#58a6ff] transition cursor-pointer"
                                title="View Verified Code"
                              >
                                <Code2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <Link
                              to={`/workspace/${prob.slug || prob.id}`}
                              className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1 ${
                                prob.userStatus === 'SOLVED'
                                  ? 'bg-[#1f883d]/10 text-[#1a7f37] hover:bg-[#1a7f37] hover:text-white dark:bg-[#2ea04326] dark:text-[#3fb950]'
                                  : prob.userStatus === 'ATTEMPTED'
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-white'
                                  : 'bg-[#0969da]/10 text-[#0969da] hover:bg-[#0969da] hover:text-white dark:bg-[#388bfd26] dark:text-[#58a6ff]'
                              }`}
                            >
                              <span>
                                {prob.userStatus === 'SOLVED' ? 'Solve Again' : prob.userStatus === 'ATTEMPTED' ? 'Resume' : 'Start'}
                              </span>
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* ========================================================== */
                  /* TABLE VIEW (High-Density)                                  */
                  /* ========================================================== */
                  <div className="rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] shadow-xs overflow-hidden">
                    {/* Table Column Headers */}
                    <div className="grid grid-cols-12 px-4 py-2.5 bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d] text-[11px] font-bold text-[#656d76] dark:text-[#848d97] uppercase tracking-wider items-center">
                      <div className="col-span-2 sm:col-span-1 text-center">Status</div>
                      <div className="col-span-5 sm:col-span-5 md:col-span-6">Title & Topics</div>
                      <div className="col-span-3 sm:col-span-2 text-center">Difficulty</div>
                      <div className="hidden sm:block sm:col-span-2 md:col-span-2 text-center">Acceptance</div>
                      <div className="col-span-2 sm:col-span-2 md:col-span-1 text-right">Action</div>
                    </div>

                    {/* Table Body Rows */}
                    <div className="divide-y divide-[#d0d7de] dark:divide-[#30363d]">
                      {problems.map((prob, idx) => (
                        <div
                          key={prob.id}
                          className="grid grid-cols-12 px-4 py-3 items-center hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition group text-xs"
                        >
                          {/* Column 1: Status Badge */}
                          <div className="col-span-2 sm:col-span-1 flex justify-center">
                            {prob.userStatus === 'SOLVED' ? (
                              <span
                                title="Solved"
                                className="inline-flex items-center justify-center p-1 rounded-full bg-[#dafbe1] dark:bg-[#2ea04326] text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b66] dark:border-[#2ea0434d]"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </span>
                            ) : prob.userStatus === 'ATTEMPTED' ? (
                              <span
                                title={`Attempted: ${prob.lastVerdict || 'In Progress'}`}
                                className="inline-flex items-center justify-center p-1 rounded-full bg-[#fff8c5] dark:bg-[#bb800926] text-[#9a6700] dark:text-[#d29922] border border-[#d4a72c66] dark:border-[#bb80094d]"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span
                                title="Unattempted"
                                className="inline-flex items-center justify-center p-1 rounded-full bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97] border border-[#d0d7de] dark:border-[#30363d]"
                              >
                                <Circle className="w-3 h-3 text-[#d0d7de] dark:text-[#30363d]" />
                              </span>
                            )}
                          </div>

                          {/* Column 2: Title & Topics */}
                          <div className="col-span-5 sm:col-span-5 md:col-span-6 min-w-0 pr-2">
                            <Link
                              to={`/workspace/${prob.slug || prob.id}`}
                              className="font-semibold text-[#1f2328] dark:text-[#f0f6fc] group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff] truncate block transition"
                            >
                              <span className="font-mono text-[#656d76] dark:text-[#848d97] text-[11px] mr-1.5">
                                {(page - 1) * pagination.limit + idx + 1}.
                              </span>
                              {prob.title}
                            </Link>

                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {prob.tags.slice(0, 3).map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => {
                                    setSelectedTag(t);
                                    setPage(1);
                                  }}
                                  className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#f6f8fa] dark:bg-[#0d1117] text-[#656d76] dark:text-[#848d97] border border-[#d0d7de]/70 dark:border-[#30363d] hover:border-[#0969da] hover:text-[#0969da] transition cursor-pointer"
                                >
                                  {t}
                                </button>
                              ))}

                              {/* Best runtime pill if solved */}
                              {prob.userStatus === 'SOLVED' && prob.bestRuntimeMs !== undefined && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#dafbe1] dark:bg-[#2ea04326] text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b66] dark:border-[#2ea0434d] flex items-center gap-0.5">
                                  <Zap className="w-2.5 h-2.5" />
                                  {prob.bestRuntimeMs}ms
                                </span>
                              )}

                              {/* Last error pill if attempted */}
                              {prob.userStatus === 'ATTEMPTED' && prob.lastVerdict && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#ffebe9] dark:bg-[#f8514926] text-[#cf222e] dark:text-[#f85149] border border-[#ff818266] dark:border-[#f851494d]">
                                  {prob.lastVerdict.replace(/_/g, ' ')}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Column 3: Difficulty */}
                          <div className="col-span-3 sm:col-span-2 flex justify-center">
                            {getDifficultyBadge(prob.difficulty)}
                          </div>

                          {/* Column 4: Acceptance Rate */}
                          <div className="hidden sm:flex sm:col-span-2 md:col-span-2 flex-col items-center justify-center font-mono">
                            <span className="text-[#1f2328] dark:text-[#f0f6fc] font-semibold text-xs">
                              {prob.acceptanceRate ? `${prob.acceptanceRate}%` : '58.4%'}
                            </span>
                            <span className="text-[10px] text-[#656d76] dark:text-[#848d97]">
                              {prob.totalSubmissions || 24} runs
                            </span>
                          </div>

                          {/* Column 5: Action Link & Code Preview Button */}
                          <div className="col-span-2 sm:col-span-2 md:col-span-1 flex items-center justify-end gap-1">
                            {prob.solutionCode && (
                              <button
                                onClick={() =>
                                  setCodeModal({
                                    isOpen: true,
                                    title: prob.title,
                                    code: prob.solutionCode!,
                                    runtime: prob.bestRuntimeMs,
                                    memory: prob.bestMemoryKb
                                  })
                                }
                                className="p-1 rounded hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] text-[#656d76] dark:text-[#848d97] hover:text-[#0969da] dark:hover:text-[#58a6ff] transition cursor-pointer"
                                title="View Verified Code"
                              >
                                <Code2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <Link
                              to={`/workspace/${prob.slug || prob.id}`}
                              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition flex items-center gap-1 ${
                                prob.userStatus === 'SOLVED'
                                  ? 'bg-[#1f883d]/10 text-[#1a7f37] hover:bg-[#1a7f37] hover:text-white dark:bg-[#2ea04326] dark:text-[#3fb950]'
                                  : prob.userStatus === 'ATTEMPTED'
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-white'
                                  : 'bg-[#0969da]/10 text-[#0969da] hover:bg-[#0969da] hover:text-white dark:bg-[#388bfd26] dark:text-[#58a6ff]'
                              }`}
                            >
                              <span>
                                {prob.userStatus === 'SOLVED' ? 'Solve' : prob.userStatus === 'ATTEMPTED' ? 'Resume' : 'Start'}
                              </span>
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Compact Table Pagination */}
                    {pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 bg-[#f6f8fa] dark:bg-[#161b22] border-t border-[#d0d7de] dark:border-[#30363d] text-xs text-[#656d76] dark:text-[#848d97]">
                        <div>
                          Showing <strong className="font-mono text-[#1f2328] dark:text-[#f0f6fc]">{(page - 1) * pagination.limit + 1}</strong> to{' '}
                          <strong className="font-mono text-[#1f2328] dark:text-[#f0f6fc]">{Math.min(page * pagination.limit, pagination.total)}</strong> of{' '}
                          <strong className="font-mono text-[#1f2328] dark:text-[#f0f6fc]">{pagination.total}</strong> problems
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1 || loading}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] disabled:opacity-40 transition cursor-pointer text-xs font-semibold"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            Prev
                          </button>
                          <span className="font-mono px-1">
                            {page} / {pagination.totalPages}
                          </span>
                          <button
                            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                            disabled={page >= pagination.totalPages || loading}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] disabled:opacity-40 transition cursor-pointer text-xs font-semibold"
                          >
                            Next
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </main>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: DEVELOPER CONTEXT & PROGRESS WIDGETS (3-4 Cols)  */}
          {/* ============================================================== */}
          <aside className="lg:col-span-4 xl:col-span-3 space-y-4 md:sticky md:top-20">
            {/* Widget 1: Personal Solving Progress */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#d0d7de] dark:border-[#30363d] pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e] flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-[#9a6700] dark:text-[#d29922]" />
                  Solving Progress
                </span>
                <span className="text-xs font-mono font-bold text-[#0969da] dark:text-[#58a6ff]">
                  {progressPercent}%
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-[#1f2328] dark:text-[#f0f6fc] font-mono">
                    {solvedCount}
                  </span>
                  <span className="text-xs text-[#656d76] dark:text-[#8b949e] font-medium">
                    / {totalCatalog} Solved
                  </span>
                </div>

                {/* Segmented Progress Bar */}
                <div className="h-2 w-full rounded-full bg-[#f6f8fa] dark:bg-[#21262d] overflow-hidden flex mt-2.5">
                  <div className="bg-[#2ea043] h-full" style={{ width: '48%' }} title="Easy: 8" />
                  <div className="bg-[#bb8009] h-full" style={{ width: '30%' }} title="Medium: 5" />
                  <div className="bg-[#cf222e] h-full" style={{ width: '12%' }} title="Hard: 1" />
                </div>
              </div>

              {/* Progress Breakdown */}
              <div className="space-y-1.5 pt-1 text-xs font-medium">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#1a7f37] dark:text-[#3fb950]">
                    <span className="w-2 h-2 rounded-full bg-[#2ea043]" />
                    Easy
                  </span>
                  <span className="font-mono text-[#656d76] dark:text-[#848d97]">8 / 20</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#9a6700] dark:text-[#d29922]">
                    <span className="w-2 h-2 rounded-full bg-[#bb8009]" />
                    Medium
                  </span>
                  <span className="font-mono text-[#656d76] dark:text-[#848d97]">5 / 20</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[#cf222e] dark:text-[#f85149]">
                    <span className="w-2 h-2 rounded-full bg-[#cf222e]" />
                    Hard
                  </span>
                  <span className="font-mono text-[#656d76] dark:text-[#848d97]">1 / 10</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#d0d7de] dark:border-[#30363d]">
                <Link
                  to="/dashboard"
                  className="text-xs font-semibold text-[#0969da] dark:text-[#58a6ff] hover:underline flex items-center justify-between"
                >
                  <span>Open Full Analytics</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Widget 2: Daily Challenge (POTD) Launcher */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Daily Challenge
                </span>
                <span className="text-[10px] font-mono font-bold text-[#656d76] dark:text-[#8b949e]">
                  Today
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                  Container With Most Water
                </h4>
                <p className="text-[11px] text-[#656d76] dark:text-[#8b949e] mt-1 leading-relaxed">
                  Two-pointer geometric liquid storage challenge. Run under 20ms kernel budget.
                </p>
              </div>

              <Link
                to="/workspace/container-with-most-water"
                className="w-full py-2 px-3 rounded-lg bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Solve Today&apos;s Challenge</span>
              </Link>
            </div>

            {/* Widget 3: Topic Taxonomy Cloud */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#d0d7de] dark:border-[#30363d] pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e] flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  Topics Taxonomy
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {Object.entries(TOPIC_COUNTS).map(([topic, count]) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      setSelectedTag(topic === selectedTag ? 'All Topics' : topic);
                      setActiveTab('all');
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer flex items-center gap-1.5 border ${
                      selectedTag === topic
                        ? 'bg-[#0969da] text-white border-[#0969da] font-semibold'
                        : 'bg-[#f6f8fa] dark:bg-[#0d1117] text-[#656d76] dark:text-[#848d97] border-[#d0d7de] dark:border-[#30363d] hover:border-[#8c959f] dark:hover:border-[#6e7681]'
                    }`}
                  >
                    <span>{topic}</span>
                    <span className={`text-[10px] font-mono ${selectedTag === topic ? 'text-white/80' : 'text-[#8c959f] dark:text-[#6e7681]'}`}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 3. SOLUTION CODE PREVIEW MODAL                                     */}
      {/* ================================================================== */}
      {codeModal && codeModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="px-5 py-4 border-b border-[#30363d] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#3fb950]" />
                <div>
                  <h3 className="text-sm font-bold text-[#f0f6fc]">
                    {codeModal.title} - Accepted Solution
                  </h3>
                  <p className="text-xs text-[#8b949e] font-mono mt-0.5">
                    {codeModal.runtime !== undefined ? `Best Runtime: ${codeModal.runtime}ms` : 'Accepted Submission'}
                    {codeModal.memory ? ` • ${Math.round(codeModal.memory / 1024)} MB Memory` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCodeModal(null)}
                className="p-1 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#0d1117] max-h-96 overflow-y-auto">
              <pre className="font-mono text-xs text-[#e6edf3] whitespace-pre-wrap leading-relaxed select-all">
                {codeModal.code}
              </pre>
            </div>

            <div className="px-5 py-3 border-t border-[#30363d] bg-[#161b22] flex items-center justify-between">
              <button
                onClick={() => copyCodeToClipboard(codeModal.code)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#30363d] text-xs font-semibold text-[#c9d1d9] hover:bg-[#21262d] transition cursor-pointer"
              >
                {codeCopied ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{codeCopied ? 'Copied!' : 'Copy Code'}</span>
              </button>

              <button
                onClick={() => setCodeModal(null)}
                className="px-4 py-1.5 rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
