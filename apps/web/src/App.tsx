import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { SidebarDrawer } from './components/SidebarDrawer';
import { TopHeader } from './components/TopHeader';
import { HeroLandingPage } from './pages/HeroLandingPage';
import { DeveloperHomePage } from './pages/DeveloperHomePage';
import { ProblemListPage } from './pages/ProblemListPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AlgorithmsPage } from './pages/AlgorithmsPage';
import { AlgorithmDetailPage } from './pages/AlgorithmDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { CreateProblemPage } from './pages/CreateProblemPage';
import { AdminProblemReviewPage } from './pages/AdminProblemReviewPage';
import { AdminProblemManagementPage } from './pages/AdminProblemManagementPage';
import { useAuthStore } from './store/useAuthStore';

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '1000000000000-dummygoogleclientidforinitialization.apps.googleusercontent.com';

function HomeRoute() {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) {
    return <DeveloperHomePage />;
  }
  return <HeroLandingPage />;
}

function AppLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f8fa] dark:bg-[#010409] text-[#1f2328] dark:text-[#e6edf3] font-sans transition-colors duration-200">
      {/* Top Utility Header Bar with Profile & Logout dropdown */}
      {!isAuthPage && (
        <TopHeader
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      )}

      {/* GitHub-style Flyout Sidebar Drawer (Slides in on Hamburger click, Closes on Close click) */}
      <SidebarDrawer
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 flex flex-col min-w-0">
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/problems" element={<ProblemListPage />} />
            <Route path="/algorithms" element={<AlgorithmsPage />} />
            <Route path="/algorithms/:slug" element={<AlgorithmDetailPage />} />
            <Route path="/workspace/:id" element={<WorkspacePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/create-problem" element={<CreateProblemPage />} />
            <Route path="/admin/proposals" element={<AdminProblemReviewPage />} />
            <Route path="/admin/problems" element={<AdminProblemManagementPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </main>
        <footer className="border-t border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] py-8 text-center text-xs text-[#57606a] dark:text-[#8b949e] transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#1f2328] dark:text-[#e6edf3]">AI Code Evolution Lab</span>
              <span className="text-[#8c959f] dark:text-[#6e7681]">&bull;</span>
              <span className="text-[#1a7f37] dark:text-[#3fb950] font-mono text-[11px] font-semibold">GV2 Release</span>
            </div>
            <div className="flex items-center gap-6 text-[#57606a] dark:text-[#8b949e]">
              <Link to="/problems" className="hover:text-[#1f2328] dark:hover:text-[#e6edf3] transition">Catalog</Link>
              <Link to="/algorithms" className="hover:text-[#1f2328] dark:hover:text-[#e6edf3] transition">Visualizer</Link>
              <Link to="/leaderboard" className="hover:text-[#1f2328] dark:hover:text-[#e6edf3] transition">Rankings</Link>
              <a
                href="https://github.com/mohankunjam25-hue/AiCA"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#1f2328] dark:hover:text-[#e6edf3] transition"
              >
                GitHub
              </a>
            </div>
            <p className="text-[#8c959f] dark:text-[#6e7681]">
              &copy; {new Date().getFullYear()} Team AICA. Built for collaborative code analysis.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}
export default App;
