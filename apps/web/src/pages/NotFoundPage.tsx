import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Code2, Trophy, Compass, BookOpen } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 min-h-[60vh] bg-[#f6f8fa] dark:bg-[#010409] text-[#1f2328] dark:text-[#e6edf3] font-sans transition-colors duration-200">
      <div className="max-w-lg w-full text-center space-y-6 animate-in fade-in zoom-in-95">
        {/* 404 Large Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#afb8c133] dark:bg-[#21262d] text-[#57606a] dark:text-[#8b949e] font-mono text-xs font-semibold">
          <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
          <span>HTTP 404: Not Found</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-[#1f2328] dark:text-[#f0f6fc]">
            Lost in Code Space?
          </h1>
          <p className="text-sm text-[#57606a] dark:text-[#8b949e] max-w-md mx-auto leading-relaxed">
            The problem challenge, solution report, or route you are looking for has either been moved, renamed, or does not exist.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-xs font-semibold text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] shadow-2xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0969da] hover:bg-[#0854ad] text-white text-xs font-bold shadow-xs transition"
          >
            <Home className="w-4 h-4" />
            <span>Developer Home</span>
          </Link>
        </div>

        {/* Quick Route Explore Cards */}
        <div className="pt-6 border-t border-[#d0d7de] dark:border-[#30363d]/60">
          <span className="block text-[11px] font-bold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider mb-3">
            Popular Destinations
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
            <Link
              to="/problems"
              className="p-3 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] hover:border-[#0969da] dark:hover:border-[#58a6ff] hover:shadow-xs transition group block"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff]">
                <BookOpen className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff]" />
                <span>Problem Catalog</span>
              </div>
              <p className="text-[11px] text-[#57606a] dark:text-[#8b949e] mt-1 line-clamp-1">
                Explore algorithmic problems
              </p>
            </Link>

            <Link
              to="/algorithms"
              className="p-3 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] hover:border-[#8250df] dark:hover:border-[#bc8cff] hover:shadow-xs transition group block"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] group-hover:text-[#8250df] dark:group-hover:text-[#bc8cff]">
                <Code2 className="w-4 h-4 text-[#8250df] dark:text-[#bc8cff]" />
                <span>Visualizer</span>
              </div>
              <p className="text-[11px] text-[#57606a] dark:text-[#8b949e] mt-1 line-clamp-1">
                Interactive step-by-step
              </p>
            </Link>

            <Link
              to="/leaderboard"
              className="p-3 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] hover:border-[#1a7f37] dark:hover:border-[#3fb950] hover:shadow-xs transition group block"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] group-hover:text-[#1a7f37] dark:group-hover:text-[#3fb950]">
                <Trophy className="w-4 h-4 text-[#1a7f37] dark:text-[#3fb950]" />
                <span>Leaderboard</span>
              </div>
              <p className="text-[11px] text-[#57606a] dark:text-[#8b949e] mt-1 line-clamp-1">
                Global developer rankings
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
