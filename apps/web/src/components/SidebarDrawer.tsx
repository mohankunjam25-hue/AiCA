import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Workflow,
  Trophy,
  BarChart2,
  PlusCircle,
  ShieldCheck,
  Search,
  X,
  LogOut,
  User as UserIcon,
  Code2,
  Sparkles,
  ExternalLink,
  Users
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useDataCacheStore } from '../store/useDataCacheStore';
import { api } from '../services/api';
import { ThemeToggle } from './ThemeToggle';
import { AiCALogo } from './AiCALogo';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuickProblem {
  id: string;
  slug: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags?: string[];
}

export function SidebarDrawer({ isOpen, onClose }: SidebarDrawerProps) {
  const { user, profile, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const cachedQuickProblems = useDataCacheStore.getState().get<QuickProblem[]>('sidebar_quick_problems');
  const [problems, setProblems] = useState<QuickProblem[]>(cachedQuickProblems || []);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on ESC key and lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Fetch top catalog problems on first open if not already cached
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchCatalogProblems = async () => {
      const cached = useDataCacheStore.getState().get<QuickProblem[]>('sidebar_quick_problems');
      if (cached && cached.length > 0) {
        setProblems(cached);
        return;
      }

      setLoadingProblems(true);
      try {
        const res = await api.get('/problems', {
          params: { page: 1, limit: 12, sortBy: 'latest' }
        });
        if (isMounted && res.data?.data?.problems) {
          const list = res.data.data.problems;
          setProblems(list);
          useDataCacheStore.getState().set('sidebar_quick_problems', list);
        }
      } catch (err: any) {
        console.warn('[SidebarDrawer] Failed to fetch quick problems:', err.message);
      } finally {
        if (isMounted) setLoadingProblems(false);
      }
    };

    if (problems.length === 0) {
      fetchCatalogProblems();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, problems.length]);

  // Focus search input when revealed
  useEffect(() => {
    if (isSearchVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchVisible]);

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/login');
  };

  const filteredProblems = problems.filter((p) =>
    p.title.toLowerCase().includes(filterSearch.toLowerCase().trim())
  );

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return 'text-[#1a7f37] dark:text-[#3fb950] bg-[#dafbe1] dark:bg-[#2ea04326] border-[#4ac26b66] dark:border-[#2ea0434d]';
      case 'MEDIUM':
        return 'text-[#9a6700] dark:text-[#d29922] bg-[#fff8c5] dark:bg-[#bb800926] border-[#d4a72c66] dark:border-[#bb80094d]';
      case 'HARD':
        return 'text-[#cf222e] dark:text-[#f85149] bg-[#ffebe9] dark:bg-[#f8514926] border-[#ff818266] dark:border-[#f851494d]';
      default:
        return 'text-[#57606a] dark:text-[#8b949e] bg-[#f6f8fa] dark:bg-[#21262d] border-[#d0d7de] dark:border-[#30363d]';
    }
  };

  const getDifficultyDot = (diff: string) => {
    switch (diff) {
      case 'EASY':
        return 'bg-[#2ea043]';
      case 'MEDIUM':
        return 'bg-[#bb8009]';
      case 'HARD':
        return 'bg-[#f85149]';
      default:
        return 'bg-[#8b949e]';
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Flyout Sidebar Drawer */}
      <aside
        aria-label="GitHub Style Navigation Drawer"
        className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-[#161b22] border-r border-[#d0d7de] dark:border-[#30363d] z-50 shadow-2xl flex flex-col transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header (Logo on Left, Close on Right) */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#d0d7de] dark:border-[#30363d] shrink-0 bg-white dark:bg-[#161b22]">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-2.5 group"
          >
            <AiCALogo className="w-9 h-9" />
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-[#1f2328] dark:text-[#f0f6fc] group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff] transition">
                AI Code Evolution
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#dafbe1] dark:bg-[#2ea04326] text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b66] dark:border-[#2ea0434d] font-mono">
                GV2
              </span>
            </div>
          </Link>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close navigation sidebar"
            className="p-1.5 rounded-md text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] border border-transparent hover:border-[#d0d7de] dark:hover:border-[#30363d] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {/* 1. Primary Navigation Section */}
          <nav className="space-y-0.5 text-xs font-semibold">
            <Link
              to="/"
              onClick={onClose}
              className={`flex items-center justify-between px-3 py-2 rounded-md transition ${
                location.pathname === '/'
                  ? 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] font-bold border-l-2 border-[#0969da] dark:border-[#58a6ff]'
                  : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'
              }`}
            >
              <span className="flex items-center gap-3">
                <Home className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff]" />
                <span>Home (Daily Hub)</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                POTD
              </span>
            </Link>

            <Link
              to="/problems"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
                location.pathname.startsWith('/problems')
                  ? 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] font-bold border-l-2 border-[#1a7f37] dark:border-[#3fb950]'
                  : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#1a7f37] dark:text-[#3fb950]" />
              Problems
            </Link>

            <Link
              to="/algorithms"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
                location.pathname.startsWith('/algorithms')
                  ? 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] font-bold border-l-2 border-[#8250df] dark:border-[#a371f7]'
                  : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'
              }`}
            >
              <Workflow className="w-4 h-4 text-[#8250df] dark:text-[#a371f7]" />
              Algorithms
            </Link>

            <Link
              to="/leaderboard"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
                location.pathname.startsWith('/leaderboard')
                  ? 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] font-bold border-l-2 border-[#9a6700] dark:border-[#d29922]'
                  : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'
              }`}
            >
              <Trophy className="w-4 h-4 text-[#9a6700] dark:text-[#d29922]" />
              Leaderboards
            </Link>

            <Link
              to="/developers"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition ${
                location.pathname.startsWith('/developers')
                  ? 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] font-bold border-l-2 border-[#8250df] dark:border-[#a371f7]'
                  : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'
              }`}
            >
              <Users className="w-4 h-4 text-[#8250df] dark:text-[#a371f7]" />
              Developers
            </Link>

            <Link
              to="/dashboard"
              onClick={onClose}
              className={`flex items-center justify-between px-3 py-2 rounded-md transition ${
                location.pathname.startsWith('/dashboard')
                  ? 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] font-bold border-l-2 border-[#0969da] dark:border-[#58a6ff]'
                  : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'
              }`}
            >
              <span className="flex items-center gap-3">
                <BarChart2 className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff]" />
                <span>Dashboard (Analytics)</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#f6f8fa] dark:bg-[#21262d] text-[#57606a] dark:text-[#8b949e] border border-[#d0d7de] dark:border-[#30363d]">
                Stats
              </span>
            </Link>
          </nav>

          {/* 2. Staff Controls Section (if ADMIN / INSTRUCTOR) */}
          {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
            <>
              <div className="pt-2 border-t border-[#d0d7de] dark:border-[#30363d]" />
              <div className="space-y-0.5">
                <div className="px-3 pb-1 text-[11px] font-bold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider">
                  Staff Controls
                </div>
                <Link
                  to="/admin/problems?create=true"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold text-[#8250df] dark:text-[#bc8cff] hover:bg-[#8250df15] dark:hover:bg-[#bc8cff15] transition"
                >
                  <PlusCircle className="w-4 h-4 text-[#8250df] dark:text-[#bc8cff]" />
                  Create Question
                </Link>
                <Link
                  to="/admin/problems"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold text-[#0969da] dark:text-[#58a6ff] hover:bg-[#0969da15] dark:hover:bg-[#58a6ff15] transition"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Manage Catalog
                </Link>
              </div>
            </>
          )}

          {/* 3. GitHub "Top Repositories" Style: "Top Problems" Section */}
          <div className="pt-2 border-t border-[#d0d7de] dark:border-[#30363d]">
            <div className="flex items-center justify-between px-3 pb-2">
              <span className="text-[12px] font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                Top Problems
              </span>
              <button
                onClick={() => setIsSearchVisible(!isSearchVisible)}
                aria-label="Toggle problem search"
                className="p-1 rounded-md text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick search input */}
            {isSearchVisible && (
              <div className="px-3 pb-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#656d76] dark:text-[#848d97]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="Find a problem..."
                    className="w-full pl-8 pr-2.5 py-1 text-xs rounded-md bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] text-[#1f2328] dark:text-[#e6edf3] placeholder-[#656d76] dark:placeholder-[#848d97] focus:outline-hidden focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff]"
                  />
                </div>
              </div>
            )}

            {/* Problem list items */}
            <div className="space-y-0.5">
              {loadingProblems ? (
                <div className="px-3 py-4 text-xs text-[#656d76] dark:text-[#848d97] font-mono">
                  Loading catalog...
                </div>
              ) : filteredProblems.length === 0 ? (
                <div className="px-3 py-3 text-xs text-[#656d76] dark:text-[#848d97]">
                  No matching problems found.
                </div>
              ) : (
                filteredProblems.slice(0, 7).map((prob) => (
                  <Link
                    key={prob.id || prob.slug}
                    to={`/workspace/${prob.slug}`}
                    onClick={onClose}
                    className="flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] group transition text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${getDifficultyDot(
                          prob.difficulty
                        )}`}
                      />
                      <span className="truncate text-[#1f2328] dark:text-[#e6edf3] group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff]">
                        {prob.title}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${getDifficultyColor(
                        prob.difficulty
                      )}`}
                    >
                      {prob.difficulty}
                    </span>
                  </Link>
                ))
              )}

              <Link
                to="/problems"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 pt-2 text-[11px] font-semibold text-[#0969da] dark:text-[#58a6ff] hover:underline"
              >
                <span>View all catalog problems</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
