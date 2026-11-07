import { useState, useEffect } from 'react';
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
  Plus
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

const SORT_OPTIONS: { label: string; value: ProblemSortOption }[] = [
  { label: 'Latest Added', value: 'latest' },
  { label: 'Difficulty: Easy to Hard', value: 'difficulty_asc' },
  { label: 'Difficulty: Hard to Easy', value: 'difficulty_desc' },
  { label: 'Title: A to Z', value: 'title_asc' }
];

export function ProblemListPage() {
  const { user } = useAuthStore();
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

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

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
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            Easy
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Medium
          </span>
        );
      case 'HARD':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 dark:text-indigo-400" />
            Problem Catalog
          </h1>
        </div>

        {/* Action Buttons & Difficulty Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
            <div className="flex items-center gap-2">
              <Link
                to="/admin/problems?create=true"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Question
              </Link>
              <Link
                to="/create-problem"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-purple-500" />
                AI Generator
              </Link>
            </div>
          )}

          <div className="flex items-center gap-2">
            {['ALL', 'EASY', 'MEDIUM', 'HARD'].map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDifficulty(d);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  difficulty === d
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xs'
                }`}
              >
                {d === 'ALL' ? 'All Difficulties' : d.charAt(0) + d.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Bar & Sorting */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search problems by title or algorithm description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-xs transition"
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as ProblemSortOption);
                setPage(1);
              }}
              className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl pl-9 pr-8 py-2.5 focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {isFiltered && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 transition cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Algorithmic Topic Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500 mr-1 shrink-0">
          <Filter className="w-3 h-3" /> Topics:
        </span>
        {TOPIC_TAGS.map((t) => (
          <button
            key={t}
            onClick={() => {
              setSelectedTag(t);
              setPage(1);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              selectedTag === t
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Problem Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-16 text-center space-y-3 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
            <p className="text-sm font-mono text-slate-500 dark:text-slate-400">Loading catalog problems...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-rose-200 dark:border-rose-900/40 space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm">{error}</p>
            <button
              onClick={fetchProblems}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : problems.length === 0 ? (
          <div className="p-16 text-center bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-slate-800 dark:text-slate-200 font-semibold text-base">
              No problems found
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm mx-auto">
              We couldn&apos;t find any algorithmic challenges matching your current search, topic, or difficulty criteria.
            </p>
            {isFiltered && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          problems.map((prob) => (
            <Link
              key={prob.id}
              to={`/workspace/${prob.slug || prob.id}`}
              className="group p-5 rounded-2xl bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between transition shadow-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {prob.userStatus === 'SOLVED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      Solved
                    </span>
                  )}
                  {prob.userStatus === 'ATTEMPTED' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                      <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      Attempted
                    </span>
                  )}
                  <span className="font-bold text-base text-slate-900 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    {prob.title}
                  </span>
                  {getDifficultyBadge(prob.difficulty)}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {prob.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tag}
                    </span>
                  ))}
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono ml-1">
                    {prob.totalSubmissions} submissions
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition">
                Solve Challenge
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <strong className="font-mono text-slate-800 dark:text-slate-200">{(page - 1) * pagination.limit + 1}</strong> to{' '}
            <strong className="font-mono text-slate-800 dark:text-slate-200">{Math.min(page * pagination.limit, pagination.total)}</strong> of{' '}
            <strong className="font-mono text-slate-800 dark:text-slate-200">{pagination.total}</strong> challenges
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>
            <span className="font-mono px-2">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
