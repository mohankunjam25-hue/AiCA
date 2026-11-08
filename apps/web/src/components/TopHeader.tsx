import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  User as UserIcon,
  Settings,
  History,
  LayoutDashboard,
  Trophy,
  Sun,
  Moon,
  Laptop,
  LogOut,
  Sparkles,
  ShieldCheck,
  Bot,
  Eye
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { ThemeToggle } from './ThemeToggle';
import { AiCALogo } from './AiCALogo';

interface TopHeaderProps {
  onOpenSidebar: () => void;
}

export function TopHeader({ onOpenSidebar }: TopHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isStudentPreviewMode = useAuthStore((s) => s.isStudentPreviewMode);
  const setStudentPreviewMode = useAuthStore((s) => s.setStudentPreviewMode);
  const logout = useAuthStore((s) => s.logout);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
      }
    }

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    setIsProfileOpen(false);
    navigate(path);
  };

  // Determine page title context for top bar
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Daily Coding Hub';
    if (path.startsWith('/problems')) return 'Problem Catalog';
    if (path.startsWith('/algorithms')) return 'Algorithm Visualizer';
    if (path.startsWith('/workspace')) return 'Interactive Code Lab';
    if (path.startsWith('/leaderboard')) return 'Global Leaderboards';
    if (path.startsWith('/developers')) return 'Developer Community';
    if (path.startsWith('/dashboard')) return 'Developer Dashboard';
    if (path.startsWith('/profile')) return 'Developer Profile';
    if (path.startsWith('/admin/dashboard') || path === '/admin') return 'Admin Mission Control';
    if (path.startsWith('/admin/problems')) {
      return location.search.includes('create=true') ? 'Problem Authoring Studio' : 'Problem Management';
    }
    if (path.startsWith('/admin/proposals')) return 'Proposal Reviews';
    if (path.startsWith('/create-problem')) return 'Problem Studio';
    return 'AI Code Evolution Lab';
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-[#161b22]/95 backdrop-blur-md border-b border-[#d0d7de] dark:border-[#30363d] transition-colors duration-200">
      <div className="h-full px-3 sm:px-6 flex items-center justify-between gap-4">
        {/* Left Section: GitHub Hamburger Trigger + Brand/Context */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Hamburger Trigger: ALWAYS VISIBLE across Desktop & Mobile like GitHub */}
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open Navigation Sidebar"
            className="p-1.5 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition cursor-pointer flex items-center justify-center shrink-0"
            title="Open Navigation Menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Logo & Context Title */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <AiCALogo className="w-9 h-9 sm:w-10 sm:h-10" />
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-[#1f2328] dark:text-[#f0f6fc] group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff] transition">
                AI Code Evolution Lab
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#dafbe1] dark:bg-[#2ea04326] text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b66] dark:border-[#2ea0434d] font-mono">
                GV2
              </span>
            </div>
          </Link>

          {/* Authenticated breadcrumb */}
          {isAuthenticated && (
            <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-[#d0d7de] dark:border-[#30363d] text-xs font-mono text-[#57606a] dark:text-[#8b949e]">
              <span>/</span>
              <span className="text-[#1f2328] dark:text-[#e6edf3] font-sans font-medium">
                {getPageTitle()}
              </span>
            </div>
          )}
        </div>

        {/* Right Section: ONLY Avatar when authenticated (GitHub Style) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {!isAuthenticated && <ThemeToggle />}

          {isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
            <button
              type="button"
              onClick={() => {
                if (location.pathname.startsWith('/admin')) {
                  setStudentPreviewMode(true);
                  navigate('/problems');
                } else {
                  setStudentPreviewMode(false);
                  navigate('/admin/dashboard');
                }
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 shadow-2xs transition cursor-pointer"
              title={location.pathname.startsWith('/admin') ? 'Switch to Student View' : 'Go to Admin Mission Control'}
            >
              {location.pathname.startsWith('/admin') ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>View as Student</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Admin Console</span>
                </>
              )}
            </button>
          )}

          {isAuthenticated ? (
            <div className="relative">
              {/* Profile Avatar Trigger Button: ONLY Avatar shown */}
              <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`relative rounded-full transition cursor-pointer flex items-center justify-center shrink-0 p-0.5 ${
                  isProfileOpen
                    ? 'ring-2 ring-[#0969da] dark:ring-[#58a6ff]'
                    : 'hover:ring-2 hover:ring-[#d0d7de] dark:hover:ring-[#30363d]'
                }`}
                aria-label="User navigation menu"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={user?.username}
                    className="w-8 h-8 rounded-full object-cover border border-[#d0d7de] dark:border-[#30363d]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#f6f8fa] dark:bg-[#21262d] text-[#0969da] dark:text-[#58a6ff] flex items-center justify-center text-xs font-bold font-mono border border-[#d0d7de] dark:border-[#30363d]">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#2ea043] ring-2 ring-white dark:ring-[#161b22]" />
              </button>

              {/* GitHub Primer Profile Dropdown Menu */}
              {isProfileOpen && (
                <div
                  ref={dropdownRef}
                  role="menu"
                  aria-orientation="vertical"
                  className="absolute right-0 top-full mt-2 w-72 rounded-md bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                >
                  {/* User Profile Overview */}
                  <div className="p-2.5 rounded-md bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] mb-1.5">
                    <p className="text-[11px] text-[#57606a] dark:text-[#8b949e]">Signed in as</p>
                    <p className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] truncate">
                      {profile?.fullName || user?.username}
                    </p>
                    <p className="text-[11px] text-[#57606a] dark:text-[#8b949e] font-mono truncate">
                      @{user?.username}
                    </p>
                    <div className="mt-2 pt-1.5 border-t border-[#d0d7de] dark:border-[#30363d] flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-[#1a7f37] dark:text-[#3fb950] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#1a7f37] dark:text-[#3fb950]" />
                        GV2 Developer
                      </span>
                      <span
                        className={`font-mono uppercase font-bold px-1.5 py-0.5 rounded-full border ${
                          user?.role === 'ADMIN'
                            ? 'bg-[#ffebe9] dark:bg-[#f8514926] text-[#cf222e] dark:text-[#f85149] border-[#ff818266] dark:border-[#f851494d]'
                            : user?.role === 'INSTRUCTOR'
                            ? 'bg-[#fbefff] dark:bg-[#8250df26] text-[#8250df] dark:text-[#bc8cff] border-[#d2a8ff66] dark:border-[#8250df4d]'
                            : 'bg-[#ddf4ff] dark:bg-[#388bfd26] text-[#0969da] dark:text-[#58a6ff] border-[#54aeff66] dark:border-[#388bfd4d]'
                        }`}
                      >
                        {user?.role || 'STUDENT'}
                      </span>
                    </div>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => handleNavigate('/profile?tab=info')}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition cursor-pointer text-left font-medium"
                    >
                      <UserIcon className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff]" />
                      <span>Your Profile</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigate('/dashboard')}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition cursor-pointer text-left font-medium"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#8250df] dark:text-[#a371f7]" />
                      <span>Your Dashboard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigate('/profile?tab=activity')}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition cursor-pointer text-left font-medium"
                    >
                      <History className="w-4 h-4 text-[#9a6700] dark:text-[#d29922]" />
                      <span>Submission History</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavigate('/leaderboard')}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition cursor-pointer text-left font-medium"
                    >
                      <Trophy className="w-4 h-4 text-[#bf8700] dark:text-[#e3b341]" />
                      <span>Global Rankings</span>
                    </button>
                  </div>

                  {/* Staff Management Section (Hidden for Students) */}
                  {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
                    <>
                      <div className="border-t border-[#d0d7de] dark:border-[#30363d] my-1.5" />
                      <div className="px-2.5 py-1 text-[10px] font-bold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider">
                        Staff Controls
                      </div>
                      <div className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => handleNavigate('/admin/dashboard')}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition cursor-pointer text-left font-semibold"
                        >
                          <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span>Admin Mission Control</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNavigate('/admin/problems')}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[#0969da] dark:text-[#58a6ff] hover:bg-[#0969da15] transition cursor-pointer text-left font-semibold"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Manage Problem Catalog</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleNavigate('/admin/proposals')}
                          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[#8250df] dark:text-[#bc8cff] hover:bg-[#8250df15] transition cursor-pointer text-left font-semibold"
                        >
                          <Bot className="w-4 h-4" />
                          <span>Review Question Proposals</span>
                        </button>
                      </div>
                    </>
                  )}

                  <div className="border-t border-[#d0d7de] dark:border-[#30363d] my-1.5" />

                  {/* Settings Link */}
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => handleNavigate('/profile?tab=settings')}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition cursor-pointer text-left font-medium"
                    >
                      <div className="flex items-center gap-2.5">
                        <Settings className="w-4 h-4 text-[#57606a] dark:text-[#8b949e]" />
                        <span>Settings & Preferences</span>
                      </div>
                      <span className="text-[10px] text-[#57606a] dark:text-[#8b949e] font-mono">IDE & Theme</span>
                    </button>
                  </div>

                  <div className="border-t border-[#d0d7de] dark:border-[#30363d] my-1.5" />

                  {/* Inline 3-Way Segmented Theme Switcher */}
                  <div className="px-2.5 py-1">
                    <div className="flex items-center justify-between text-[11px] text-[#57606a] dark:text-[#8b949e] mb-1.5">
                      <span>Appearance</span>
                      <span className="capitalize font-mono text-[10px] text-[#1f2328] dark:text-[#f0f6fc]">
                        {theme}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 p-0.5 rounded-md bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d]">
                      <button
                        type="button"
                        onClick={() => setTheme('light')}
                        className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                          theme === 'light'
                            ? 'bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] shadow-xs font-semibold'
                            : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                        }`}
                        title="Light Theme"
                      >
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>Light</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTheme('dark')}
                        className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                          theme === 'dark'
                            ? 'bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] shadow-xs font-semibold'
                            : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                        }`}
                        title="Dark Theme"
                      >
                        <Moon className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Dark</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTheme('system')}
                        className={`flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                          theme === 'system'
                            ? 'bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] shadow-xs font-semibold'
                            : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                        }`}
                        title="Sync with OS"
                      >
                        <Laptop className="w-3.5 h-3.5 text-teal-500" />
                        <span>Auto</span>
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-[#d0d7de] dark:border-[#30363d] my-1.5" />

                  {/* Sign Out Button */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[#cf222e] dark:text-[#f85149] hover:bg-[#ffebe9] dark:hover:bg-[#f851491a] transition cursor-pointer text-left font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] text-xs font-semibold transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 rounded-md bg-[#1f883d] dark:bg-[#238636] hover:bg-[#1a7f37] dark:hover:bg-[#2ea043] text-white text-xs font-semibold shadow-xs transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
