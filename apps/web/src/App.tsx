import React, { useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { SidebarDrawer } from './components/SidebarDrawer';
import { TopHeader } from './components/TopHeader';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './store/useAuthStore';
import { PageLoadingFallback } from './components/ui/PageLoadingFallback';
import { NetworkStatusIndicator } from './components/NetworkStatusIndicator';

// 🚀 Dynamic Route-Level Code Splitting (Lazy-loaded on demand)
const HeroLandingPage = React.lazy(() => import('./pages/HeroLandingPage').then(m => ({ default: m.HeroLandingPage })));
const DeveloperHomePage = React.lazy(() => import('./pages/DeveloperHomePage').then(m => ({ default: m.DeveloperHomePage })));
const ProblemListPage = React.lazy(() => import('./pages/ProblemListPage').then(m => ({ default: m.ProblemListPage })));
const WorkspacePage = React.lazy(() => import('./pages/WorkspacePage').then(m => ({ default: m.WorkspacePage })));
const LeaderboardPage = React.lazy(() => import('./pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const AlgorithmsPage = React.lazy(() => import('./pages/AlgorithmsPage').then(m => ({ default: m.AlgorithmsPage })));
const AlgorithmDetailPage = React.lazy(() => import('./pages/AlgorithmDetailPage').then(m => ({ default: m.AlgorithmDetailPage })));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const CreateProblemPage = React.lazy(() => import('./pages/CreateProblemPage').then(m => ({ default: m.CreateProblemPage })));
const AdminProblemReviewPage = React.lazy(() => import('./pages/AdminProblemReviewPage').then(m => ({ default: m.AdminProblemReviewPage })));
const AdminProblemManagementPage = React.lazy(() => import('./pages/AdminProblemManagementPage').then(m => ({ default: m.AdminProblemManagementPage })));
const DeveloperProfilePage = React.lazy(() => import('./pages/DeveloperProfilePage').then(m => ({ default: m.DeveloperProfilePage })));
const DeveloperDirectoryPage = React.lazy(() => import('./pages/DeveloperDirectoryPage').then(m => ({ default: m.DeveloperDirectoryPage })));

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '1000000000000-dummygoogleclientidforinitialization.apps.googleusercontent.com';

function HomeRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
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
      {/* Network Connectivity Indicator */}
      <NetworkStatusIndicator />

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
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomeRoute />} />
              <Route
                path="/problems"
                element={
                  <ProtectedRoute requireAuth>
                    <ProblemListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/algorithms"
                element={
                  <ProtectedRoute requireAuth>
                    <AlgorithmsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/algorithms/:slug"
                element={
                  <ProtectedRoute requireAuth>
                    <AlgorithmDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workspace/:id"
                element={
                  <ProtectedRoute requireAuth>
                    <WorkspacePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute requireAuth>
                    <LeaderboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/developers"
                element={
                  <ProtectedRoute requireAuth>
                    <DeveloperDirectoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/developers/:username"
                element={
                  <ProtectedRoute requireAuth>
                    <DeveloperProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requireAuth>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute requireAuth>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-problem"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'INSTRUCTOR']}>
                    <CreateProblemPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/proposals"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'INSTRUCTOR']}>
                    <AdminProblemReviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/problems"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'INSTRUCTOR']}>
                    <AdminProblemManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </Suspense>
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
