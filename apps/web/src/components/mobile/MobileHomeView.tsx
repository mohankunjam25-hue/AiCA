import React from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Zap,
  Code2,
  Trophy,
  ChevronRight,
  Clock,
  Sparkles,
  Workflow,
  Terminal,
  PlusCircle,
  CheckCircle2,
} from 'lucide-react';

interface ProblemSummary {
  id: string;
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  description?: string;
  totalSubmissions?: number;
  acceptanceRate?: number | null;
}

interface MobileHomeViewProps {
  greeting: string;
  userName: string;
  streak: number;
  problemsSolved: number;
  totalSubmissions: number;
  currentPOTD: ProblemSummary | null;
  lastActive: { id: string; title: string; language: string } | null;
  problems: ProblemSummary[];
  spotlights?: ProblemSummary[];
}

const SPOTLIGHT_ACCENTS = [
  'from-emerald-500/15 to-teal-500/5 border-emerald-500/30',
  'from-blue-500/15 to-indigo-500/5 border-blue-500/30',
  'from-purple-500/15 to-pink-500/5 border-purple-500/30',
];

export function MobileHomeView({
  greeting,
  userName,
  streak,
  problemsSolved,
  totalSubmissions,
  currentPOTD,
  lastActive,
  problems,
  spotlights = [],
}: MobileHomeViewProps) {
  return (
    <div className="md:hidden flex flex-col gap-4 px-3.5 py-4 bg-[#f6f8fa] dark:bg-[#010409] text-[#1f2328] dark:text-[#e6edf3]">
      {/* 1. Compact App Greeting & Live Streak Strip */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-mono text-[#656d76] dark:text-[#848d97] uppercase tracking-wider">
            AiCA Mobile Lab
          </p>
          <h1 className="text-xl font-extrabold text-[#1f2328] dark:text-[#f0f6fc] truncate">
            {greeting}, {userName.split(' ')[0]} 👋
          </h1>
        </div>
        <Link
          to="/leaderboard"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 shrink-0 active:scale-95 transition"
        >
          <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span className="text-xs font-black font-mono">{streak}d</span>
        </Link>
      </div>

      {/* 2. Horizontal Swipeable Stat Pills */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-3.5 px-3.5 snap-x">
        <div className="snap-start shrink-0 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] flex items-center gap-2.5 min-w-[132px]">
          <div className="w-8 h-8 rounded-xl bg-[#dafbe1] dark:bg-[#2ea04326] text-[#1a7f37] dark:text-[#3fb950] flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-black font-mono leading-tight">{problemsSolved}</div>
            <div className="text-[10px] text-[#656d76] dark:text-[#848d97]">Solved</div>
          </div>
        </div>

        <div className="snap-start shrink-0 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] flex items-center gap-2.5 min-w-[132px]">
          <div className="w-8 h-8 rounded-xl bg-[#0969da]/10 dark:bg-[#58a6ff]/15 text-[#0969da] dark:text-[#58a6ff] flex items-center justify-center">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-black font-mono leading-tight">{totalSubmissions}</div>
            <div className="text-[10px] text-[#656d76] dark:text-[#848d97]">Runs</div>
          </div>
        </div>

        <Link
          to="/dashboard"
          className="snap-start shrink-0 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] flex items-center gap-2.5 min-w-[140px] active:scale-95 transition"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold leading-tight">Analytics</div>
            <div className="text-[10px] text-[#0969da] dark:text-[#58a6ff]">View Stats ›</div>
          </div>
        </Link>
      </div>

      {/* 3. Resume Last Active Draft Banner (If Any) */}
      {lastActive && (
        <Link
          to={`/workspace/${lastActive.id}`}
          className="p-3.5 rounded-2xl bg-white dark:bg-[#161b22] border border-[#0969da]/40 dark:border-[#58a6ff]/40 shadow-xs flex items-center justify-between gap-3 active:scale-[0.98] transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#0969da]/10 dark:bg-[#58a6ff]/15 text-[#0969da] dark:text-[#58a6ff] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono font-bold text-[#0969da] dark:text-[#58a6ff] uppercase">
                Continue Draft
              </div>
              <div className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] truncate">
                {lastActive.title}
              </div>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-[#0969da] text-white text-xs font-bold shrink-0">
            Resume
          </span>
        </Link>
      )}

      {/* 4. Official Daily Challenge Highlight Card */}
      {currentPOTD && (
        <div className="rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase text-[#0969da] dark:text-[#58a6ff] bg-[#0969da]/10 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Daily Challenge
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fff8c5] dark:bg-[#bb800926] text-[#9a6700] dark:text-[#d29922]">
              {currentPOTD.difficulty}
            </span>
          </div>

          <div>
            <h2 className="text-base font-bold text-[#1f2328] dark:text-[#f0f6fc]">
              {currentPOTD.title}
            </h2>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {currentPOTD.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#f6f8fa] dark:bg-[#0d1117] text-[#656d76] dark:text-[#848d97] border border-[#d0d7de]/70 dark:border-[#30363d]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          <Link
            to={`/workspace/${currentPOTD.slug || currentPOTD.id}`}
            className="w-full h-11 rounded-xl bg-[#1f883d] dark:bg-[#238636] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition"
          >
            <Zap className="w-4 h-4" />
            <span>Solve Daily Challenge</span>
          </Link>
        </div>
      )}

      {/* 5. Quick 2-Column Mobile Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link
          to="/algorithms"
          className="p-3.5 rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] flex items-center gap-2.5 active:scale-95 transition"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Workflow className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate">Visualizer</div>
            <div className="text-[10px] text-[#656d76] dark:text-[#848d97]">Step-by-step</div>
          </div>
        </Link>

        <Link
          to="/create-problem"
          className="p-3.5 rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] flex items-center gap-2.5 active:scale-95 transition"
        >
          <div className="w-9 h-9 rounded-xl bg-[#8250df]/10 text-[#8250df] dark:text-[#bc8cff] flex items-center justify-center shrink-0">
            <PlusCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate">Practice Lab</div>
            <div className="text-[10px] text-[#656d76] dark:text-[#848d97]">Custom test</div>
          </div>
        </Link>
      </div>

      {/* 6. Horizontal Swipe Spotlights Carousel */}
      {spotlights.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#656d76] dark:text-[#848d97]">
              Featured Challenges
            </h3>
            <Link to="/problems" className="text-xs font-semibold text-[#0969da] dark:text-[#58a6ff]">
              See All ›
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-3.5 px-3.5 pb-1">
            {spotlights.map((item, idx) => (
              <Link
                key={item.id || item.slug}
                to={`/workspace/${item.slug || item.id}`}
                className={`snap-start shrink-0 w-[72vw] max-w-[270px] rounded-2xl p-4 bg-gradient-to-br ${SPOTLIGHT_ACCENTS[idx % SPOTLIGHT_ACCENTS.length]} bg-white dark:bg-[#161b22] border flex flex-col justify-between gap-3 active:scale-[0.98] transition`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-[#1a7f37] dark:text-[#3fb950]">
                      {item.tags[0] || 'Algorithms'}
                    </span>
                    <span className="text-[10px] font-bold text-[#656d76] dark:text-[#848d97]">
                      {item.difficulty}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">{item.title}</h4>
                  <p className="text-[11px] text-[#57606a] dark:text-[#8b949e] line-clamp-2">
                    {item.description || 'Optimize runtime complexity under isolated kernel limits.'}
                  </p>
                </div>
                <div className="text-[11px] font-bold text-[#0969da] dark:text-[#58a6ff] flex items-center gap-1">
                  <span>Launch Lab</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 7. Recent Catalog Feed Tiles */}
      {problems.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#656d76] dark:text-[#848d97]">
            Latest Challenges
          </h3>
          <div className="rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] divide-y divide-[#d0d7de]/70 dark:divide-[#30363d] overflow-hidden">
            {problems.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                to={`/workspace/${p.slug || p.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 active:bg-[#eaeef2] dark:active:bg-[#21262d] transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Code2 className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] truncate">
                      {p.title}
                    </div>
                    <div className="text-[10px] font-mono text-[#656d76] dark:text-[#848d97]">
                      {p.difficulty} • {p.tags[0] || 'Algorithms'}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8c959f] shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
