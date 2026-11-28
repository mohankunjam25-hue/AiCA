import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Workflow, Trophy, User } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

/**
 * Native App-style Persistent Bottom Tab Bar for mobile viewports (< 768px).
 * Hidden automatically on full-screen studio routes (workspace, lftl) and auth pages.
 */
export function MobileBottomNav() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const path = location.pathname;
  const isHiddenRoute =
    path === '/login' ||
    path === '/register' ||
    path.startsWith('/workspace') ||
    path.startsWith('/lftl') ||
    (path.startsWith('/problems/') && path !== '/problems');

  if (isHiddenRoute) return null;

  const tabs = [
    {
      label: 'Home',
      to: '/',
      icon: Home,
      isActive: path === '/',
    },
    {
      label: 'Problems',
      to: isAuthenticated ? '/problems' : '/login',
      icon: BookOpen,
      isActive: path === '/problems',
    },
    {
      label: 'Visual',
      to: isAuthenticated ? '/algorithms' : '/login',
      icon: Workflow,
      isActive: path.startsWith('/algorithms'),
    },
    {
      label: 'Ranks',
      to: isAuthenticated ? '/leaderboard' : '/login',
      icon: Trophy,
      isActive: path.startsWith('/leaderboard'),
    },
    {
      label: isAuthenticated ? 'Profile' : 'Sign In',
      to: isAuthenticated ? '/profile' : '/login',
      icon: User,
      isActive: path.startsWith('/profile') || path.startsWith('/dashboard'),
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#161b22]/95 backdrop-blur-xl border-t border-[#d0d7de] dark:border-[#30363d] safe-area-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.35)]"
    >
      <div className="grid grid-cols-5 h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.label}
              to={tab.to}
              className={`relative flex flex-col items-center justify-center gap-1 min-h-[44px] active:scale-95 transition-all select-none ${
                tab.isActive
                  ? 'text-[#0969da] dark:text-[#58a6ff]'
                  : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
              }`}
            >
              {tab.isActive && (
                <span className="absolute top-0 w-8 h-0.5 rounded-full bg-[#0969da] dark:bg-[#58a6ff]" />
              )}
              <div
                className={`p-1 rounded-xl transition-colors ${
                  tab.isActive ? 'bg-[#0969da]/10 dark:bg-[#58a6ff]/15' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${tab.isActive ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} />
              </div>
              <span className={`text-[10px] leading-none tracking-tight ${tab.isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
