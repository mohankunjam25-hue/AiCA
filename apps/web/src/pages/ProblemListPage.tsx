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
  SlidersHorizontal
} from 'lucide-react';
import { ProblemListItem, ProblemDifficulty, ProblemSortOption } from '@aica/shared';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useDataCacheStore } from '../store/useDataCacheStore';

const TOPIC_TAGS = [
  'All Topics',
  'Arrays',
  'Strings',
  'Hash-Table',
  'Two-Pointers',
  'Sliding-Window',
  'Greedy',
  'Dynamic-Programming'
];

const TOPIC_COUNTS: Record<string, number> = {
  Arrays: 16,
  Strings: 12,
  'Hash-Table': 10,
  'Two-Pointers': 8,
  'Sliding-Window': 6,
  'Dynamic-Programming': 8,
  Greedy: 6
};

const SORT_OPTIONS: { label: string; value: ProblemSortOption }[] = [
  { label: 'Latest Added', value: 'latest' },
  { label: 'Difficulty: Easy to Hard', value: 'difficulty_asc' },
  { label: 'Difficulty: Hard to Easy', value: 'difficulty_desc' },
  { label: 'Title: A to Z', value: 'title_asc' }
];

export function ProblemListPage() {
  const { user, profile } = useAuthStore();
  const [problems, setProblems] = useState<ProblemListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  // Debounce search input by 250ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Keyboard shortcut: Pressing "/" or "Ctrl+K" focuses search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' && document.activeElement !== searchInputRef.current) ||
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Refetch or serve from cache when filters or pagination change
  useEffect(() => {
    fetchProblems();
  }, [page, difficulty, selectedTag, sortBy, debouncedSearch]);

  const fetchProblems = async () => {
    const cacheKey = `problems_${page}_${difficulty}_${selectedTag}_${sortBy}_${debouncedSearch}`;
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

      const res = await api.get('/problems', { params });
      const data = res.data.data;
      const fetchedProblems = data.problems || [];
      const fetchedPagination = data.pagination || null;

      setProblems(fetchedProblems);
      if (fetchedPagination) {
        setPagination(fetchedPagination);
      }

      // Store in client cache
      useDataCacheStore.getState().set(cacheKey, {
        problems: fetchedProblems,
        pagination: fetchedPagination
      });
    } catch (err: any) {
      console.warn('[ProblemListPage] Failed to fetch problems:', err.message);
      setError('Unable to load problems from catalog. Please verify your connection.');
      setProblems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setDifficulty('ALL');
    setSelectedTag('All Topics');
    setSortBy('latest');
    setPage(1);
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

  // Solving progress stats (14 / 50 fallback)
  const solvedCount = profile?.problemsSolved || 14;
  const totalCatalog = 50;
  const progressPercent = Math.round((solvedCount / totalCatalog) * 100);

  return (
    <div className="flex-1 bg-[#f6f8fa] dark:bg-[#010409] text-[#1f2328] dark:text-[#e6edf3] pb-16 transition-colors duration-200">
      {/* ================================================================== */}
      {/* 1. TOP CONTEXT HEADER BAR                                          */}
      {/* ================================================================== */}
      <div className="bg-white dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d] py-5 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-[#0969da] dark:text-[#58a6ff]" />
                Problem Catalog
              </h1>
              <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-0.5">
                Practice algorithmic challenges evaluated under strict Linux cgroup kernel sandbox isolation.
              </p>
            </div>

            {/* Staff Actions (Admin & Instructor only) */}
            {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
              <div className="flex items-center gap-2">
                <Link
                  to="/admin/problems?create=true"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Question
                </Link>
                <Link
                  to="/create-problem"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] text-xs font-semibold transition cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5 text-[#8250df] dark:text-[#a371f7]" />
                  AI Problem Studio
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 2. MAIN 2-PANE CATALOG GRID (12 Columns)                           */}
      {/* ================================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ============================================================== */}
          {/* LEFT COLUMN: CATALOG TOOLBAR + HIGH-DENSITY TABLE (8-9 Cols)   */}
          {/* ============================================================== */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-4 min-w-0">
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

            {/* High-Density Problem Table Container */}
            <div className="rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] shadow-xs overflow-hidden">
              {/* Table Column Headers */}
              <div className="grid grid-cols-12 px-4 py-2.5 bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d] text-[11px] font-bold text-[#656d76] dark:text-[#848d97] uppercase tracking-wider items-center">
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-6 sm:col-span-5 md:col-span-6">Title & Topics</div>
                <div className="col-span-3 sm:col-span-2 text-center">Difficulty</div>
                <div className="hidden sm:block sm:col-span-2 md:col-span-2 text-center">Acceptance</div>
                <div className="col-span-2 sm:col-span-2 md:col-span-1 text-right">Action</div>
              </div>

              {/* Table Body Rows */}
              {loading ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0969da] dark:text-[#58a6ff] mx-auto" />
                  <p className="text-xs font-mono text-[#656d76] dark:text-[#848d97]">
                    Loading catalog challenges...
                  </p>
                </div>
              ) : error ? (
                <div className="p-8 text-center space-y-3">
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
                <div className="py-16 text-center space-y-3">
                  <BookOpen className="w-8 h-8 text-[#8c959f] dark:text-[#6e7681] mx-auto" />
                  <p className="text-[#1f2328] dark:text-[#f0f6fc] font-bold text-sm">
                    No matching problems found
                  </p>
                  <p className="text-[#656d76] dark:text-[#848d97] text-xs max-w-sm mx-auto">
                    Try adjusting your keyword search, difficulty, or topic filter.
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
              ) : (
                <div className="divide-y divide-[#d0d7de] dark:divide-[#30363d]">
                  {problems.map((prob, idx) => (
                    <div
                      key={prob.id}
                      className="grid grid-cols-12 px-4 py-3 items-center hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition group text-xs"
                    >
                      {/* Column 1: Status Icon */}
                      <div className="col-span-1 flex justify-center">
                        {prob.userStatus === 'SOLVED' ? (
                          <span title="Solved">
                            <CheckCircle2 className="w-4 h-4 text-[#1a7f37] dark:text-[#3fb950]" />
                          </span>
                        ) : prob.userStatus === 'ATTEMPTED' ? (
                          <span title="Attempted">
                            <Clock className="w-4 h-4 text-[#9a6700] dark:text-[#d29922]" />
                          </span>
                        ) : (
                          <span title="Unattempted">
                            <Circle className="w-3.5 h-3.5 text-[#d0d7de] dark:text-[#30363d]" />
                          </span>
                        )}
                      </div>

                      {/* Column 2: Title & Topics */}
                      <div className="col-span-6 sm:col-span-5 md:col-span-6 min-w-0 pr-2">
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

                      {/* Column 5: Action Link */}
                      <div className="col-span-2 sm:col-span-2 md:col-span-1 flex justify-end">
                        <Link
                          to={`/workspace/${prob.slug || prob.id}`}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#1f883d]/10 text-[#1a7f37] hover:bg-[#1a7f37] hover:text-white dark:bg-[#2ea04326] dark:text-[#3fb950] dark:hover:bg-[#238636] dark:hover:text-white transition flex items-center gap-1"
                        >
                          <span>Solve</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
    </div>
  );
}
