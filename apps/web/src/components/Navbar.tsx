import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Trophy,
  BarChart2,
  BookOpen,
  LogOut,
  User as UserIcon,
  Workflow,
  ShieldCheck,
  PlusCircle,
  Menu
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { ThemeToggle } from './ThemeToggle';
import { SidebarDrawer } from './SidebarDrawer';
import { AiCALogo } from './AiCALogo';

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="border-b border-[#d0d7de] dark:border-[#30363d] bg-white/95 dark:bg-[#161b22]/95 backdrop-blur-md sticky top-0 z-40 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Left: GitHub-style Hamburger Button + Brand Logo & Name */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Hamburger Button (Opens GitHub-style flyout drawer) */}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Navigation Sidebar"
              className="p-1.5 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] transition cursor-pointer flex items-center justify-center"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Brand Logo & Name */}
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <AiCALogo className="w-9 h-9 sm:w-10 sm:h-10" />
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-[#1f2328] dark:text-[#f0f6fc] group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff] transition">
                  AI Code Evolution Lab
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#dafbe1] dark:bg-[#2ea04326] text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b66] dark:border-[#2ea0434d] font-mono">
                  GV2
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-medium">
            {isAuthenticated ? (
              <>
                <Link
                  to="/problems"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    location.pathname === '/problems'
                      ? 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] border border-[#d0d7de] dark:border-[#30363d]'
                      : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#1a7f37] dark:text-[#3fb950]" />
                  Problems
                </Link>
                <Link
                  to="/algorithms"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    location.pathname === '/algorithms'
                      ? 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] border border-[#d0d7de] dark:border-[#30363d]'
                      : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'
                  }`}
                >
                  <Workflow className="w-3.5 h-3.5 text-[#0969da] dark:text-[#58a6ff]" />
                  Algorithms
                </Link>
                <Link
                  to="/leaderboard"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    location.pathname === '/leaderboard'
                      ? 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] border border-[#d0d7de] dark:border-[#30363d]'
                      : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-[#9a6700] dark:text-[#d29922]" />
                  Leaderboards
                </Link>
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                    location.pathname === '/dashboard'
                      ? 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] border border-[#d0d7de] dark:border-[#30363d]'
                      : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d]'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5 text-[#0969da] dark:text-[#58a6ff]" />
                  Dashboard
                </Link>

                {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
                  <>
                    <Link
                      to="/admin/problems?create=true"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[#8250df] dark:text-[#bc8cff] bg-[#8250df15] dark:bg-[#bc8cff15] hover:bg-[#8250df26] dark:hover:bg-[#bc8cff26] text-xs font-semibold border border-[#8250df40] dark:border-[#bc8cff40] transition"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-[#8250df] dark:text-[#bc8cff]" />
                      Create Question
                    </Link>
                    <Link
                      to="/admin/problems"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[#0969da] dark:text-[#58a6ff] bg-[#0969da15] dark:bg-[#58a6ff15] hover:bg-[#0969da26] dark:hover:bg-[#58a6ff26] text-xs font-semibold border border-[#0969da40] dark:border-[#58a6ff40] transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Manage Catalog
                    </Link>
                  </>
                )}

                <ThemeToggle className="ml-1" />

                <div className="flex items-center gap-2 ml-1 pl-2 border-l border-[#d0d7de] dark:border-[#30363d]">
                  <Link
                    to="/profile"
                    className="flex items-center gap-1.5 text-xs text-[#1f2328] dark:text-[#e6edf3] font-mono bg-[#f6f8fa] dark:bg-[#21262d] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] px-2.5 py-1 rounded-md border border-[#d0d7de] dark:border-[#30363d] transition group"
                  >
                    {profile?.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={user?.username}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-3.5 h-3.5 text-[#0969da] dark:text-[#58a6ff]" />
                    )}
                    <span>{user?.username}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-md text-[#656d76] dark:text-[#848d97] hover:text-[#cf222e] dark:hover:text-[#f85149] hover:bg-[#ffebe9] dark:hover:bg-[#f851491a] transition cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1 text-xs text-[#656d76] dark:text-[#848d97] font-medium mr-2">
                  <a href="#live-diff" className="px-2.5 py-1.5 rounded-md hover:text-[#1f2328] dark:hover:text-[#f0f6fc] transition">
                    Live Diff
                  </a>
                  <a href="#pipeline" className="px-2.5 py-1.5 rounded-md hover:text-[#1f2328] dark:hover:text-[#f0f6fc] transition">
                    Pipeline
                  </a>
                  <a href="#features" className="px-2.5 py-1.5 rounded-md hover:text-[#1f2328] dark:hover:text-[#f0f6fc] transition">
                    Features
                  </a>
                </div>

                <ThemeToggle className="mr-1" />

                <div className="flex items-center gap-2 ml-1">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] text-xs font-semibold transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-1.5 rounded-md bg-[#1f883d] dark:bg-[#238636] hover:bg-[#1a7f37] dark:hover:bg-[#2ea043] text-white text-xs font-semibold shadow-xs transition"
                  >
                    Get Started &rarr;
                  </Link>
                </div>
              </>
            )}
          </nav>

          {/* Mobile Right Action: ThemeToggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* GitHub-Style Flyout Sidebar Drawer */}
      <SidebarDrawer
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </>
  );
}
