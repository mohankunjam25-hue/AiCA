import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  Circle,
  ChevronRight,
  Share2,
  Trash2,
  X,
  Plus,
  Loader2,
  AlertCircle,
  BookOpen,
  Sparkles,
  Award,
  Code2,
  Zap,
  ChevronLeft
} from 'lucide-react';
import { ProblemListItem, ProblemDifficulty, ProblemSortOption } from '@aica/shared';
import { MobileBottomSheet } from './MobileBottomSheet';
import type { ProblemHubTab, CuratedTrack } from '../../pages/ProblemListPage';

interface MobileProblemCatalogProps {
  activeTab: ProblemHubTab;
  setActiveTab: (tab: ProblemHubTab) => void;
  search: string;
  setSearch: (val: string) => void;
  difficulty: string;
  setDifficulty: (val: string) => void;
  selectedTag: string;
  setSelectedTag: (val: string) => void;
  sortBy: ProblemSortOption;
  setSortBy: (val: ProblemSortOption) => void;
  problems: ProblemListItem[];
  loading: boolean;
  error: string | null;
  pagination: { page: number; limit: number; total: number; totalPages: number };
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  topicTags: string[];
  sortOptions: { label: string; value: ProblemSortOption }[];
  onClearFilters: () => void;
  onOpenShareModal: (e: React.MouseEvent, prob: ProblemListItem) => void;
  onDeletePractice: (e: React.MouseEvent, id: string) => void;
  onRetry: () => void;
  tracks: CuratedTrack[];
  problemStatusMap: Map<string, ProblemListItem>;
  onSelectTrack: (track: CuratedTrack) => void;
}

function getCompactDifficultyBadge(diff: ProblemDifficulty) {
  switch (diff) {
    case 'EASY':
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#dafbe1] dark:bg-[#2ea04326] text-[#1a7f37] dark:text-[#3fb950]">
          Easy
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#fff8c5] dark:bg-[#bb800926] text-[#9a6700] dark:text-[#d29922]">
          Med
        </span>
      );
    case 'HARD':
      return (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#ffebe9] dark:bg-[#f8514926] text-[#cf222e] dark:text-[#f85149]">
          Hard
        </span>
      );
  }
}

export function MobileProblemCatalog({
  activeTab,
  setActiveTab,
  search,
  setSearch,
  difficulty,
  setDifficulty,
  selectedTag,
  setSelectedTag,
  sortBy,
  setSortBy,
  problems,
  loading,
  error,
  pagination,
  page,
  setPage,
  topicTags,
  sortOptions,
  onClearFilters,
  onOpenShareModal,
  onDeletePractice,
  onRetry,
  tracks,
  problemStatusMap,
  onSelectTrack,
}: MobileProblemCatalogProps) {
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const activeFilterCount =
    (difficulty !== 'ALL' ? 1 : 0) +
    (selectedTag !== 'All Topics' ? 1 : 0) +
    (sortBy !== 'latest' ? 1 : 0);

  const tabs: Array<{ id: ProblemHubTab; label: string; icon: any }> = [
    { id: 'unsolved', label: 'Unsolved', icon: Sparkles },
    { id: 'solved', label: 'Solved', icon: CheckCircle2 },
    { id: 'pending', label: 'In-Progress', icon: Clock },
    { id: 'all', label: 'All Catalog', icon: BookOpen },
    { id: 'tracks', label: 'Tracks', icon: Award },
    { id: 'practice', label: 'My Lab', icon: Code2 },
  ];

  return (
    <div className="md:hidden flex flex-col min-h-full bg-[#f6f8fa] dark:bg-[#010409] text-[#1f2328] dark:text-[#e6edf3]">
      {/* Sticky Top Search + Segmented Chips Header */}
      <div className="sticky top-14 z-20 bg-white/95 dark:bg-[#161b22]/95 backdrop-blur-xl border-b border-[#d0d7de] dark:border-[#30363d] px-3.5 pt-3 pb-2.5 space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Native Mobile Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#656d76] dark:text-[#848d97] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems, tags..."
              className="w-full h-10 pl-9 pr-8 rounded-xl bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] text-xs font-medium text-[#1f2328] dark:text-[#f0f6fc] placeholder:text-[#656d76] dark:placeholder:text-[#848d97] focus:outline-none focus:border-[#0969da] dark:focus:border-[#58a6ff]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="p-1 rounded-full text-[#656d76] dark:text-[#848d97] absolute right-2 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Trigger Pill (Opens Native Bottom Sheet) */}
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className={`relative h-10 px-3 rounded-xl border flex items-center gap-1.5 text-xs font-semibold active:scale-95 transition shrink-0 ${
              activeFilterCount > 0
                ? 'bg-[#0969da]/10 border-[#0969da]/40 text-[#0969da] dark:text-[#58a6ff]'
                : 'bg-[#f6f8fa] dark:bg-[#21262d] border-[#d0d7de] dark:border-[#30363d] text-[#1f2328] dark:text-[#e6edf3]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="min-w-[16px] h-4 px-1 rounded-full bg-[#0969da] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Quick Practice Add Button */}
          <Link
            to="/create-problem"
            aria-label="Create Practice Problem"
            className="h-10 w-10 rounded-xl bg-[#8250df] text-white flex items-center justify-center shadow-xs active:scale-95 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Link>
        </div>

        {/* Horizontal Swipeable Segmented Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap active:scale-95 transition shrink-0 ${
                  isActive
                    ? 'bg-[#1f2328] dark:bg-[#f0f6fc] text-white dark:text-[#0d1117] shadow-2xs'
                    : 'bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97] border border-[#d0d7de]/70 dark:border-[#30363d]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Filter Indicator Strip */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            {difficulty !== 'ALL' && (
              <button
                type="button"
                onClick={() => setDifficulty('ALL')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#0969da]/10 text-[#0969da] dark:text-[#58a6ff]"
              >
                {difficulty} <X className="w-2.5 h-2.5" />
              </button>
            )}
            {selectedTag !== 'All Topics' && (
              <button
                type="button"
                onClick={() => setSelectedTag('All Topics')}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#8250df]/10 text-[#8250df] dark:text-[#bc8cff]"
              >
                #{selectedTag} <X className="w-2.5 h-2.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClearFilters}
              className="text-[10px] font-semibold text-[#cf222e] dark:text-[#f85149] ml-auto shrink-0"
            >
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-3.5 py-3">
        {activeTab === 'tracks' ? (
          /* Mobile Swipeable Curated Learning Tracks */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#656d76] dark:text-[#848d97]">
                Curated Tracks ({tracks.length})
              </h2>
              <span className="text-[10px] font-mono text-[#0969da] dark:text-[#58a6ff]">
                Swipe Tracks →
              </span>
            </div>

            <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2 -mx-3.5 px-3.5">
              {tracks.map((track) => {
                const solvedCount = track.curatedProblems.filter((cp) => {
                  const matched = problemStatusMap.get(cp.slug);
                  return matched?.userStatus === 'SOLVED';
                }).length;
                const progressPct = track.curatedProblems.length > 0
                  ? Math.round((solvedCount / track.curatedProblems.length) * 100)
                  : 0;

                return (
                  <div
                    key={track.id}
                    className="snap-start shrink-0 w-[82vw] max-w-[310px] rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] p-4 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#8250df]/10 text-[#8250df] dark:text-[#bc8cff]">
                          {track.level}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-[#1a7f37] dark:text-[#3fb950]">
                          {solvedCount}/{track.curatedProblems.length} Done
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                        {track.title}
                      </h3>
                      <p className="text-xs text-[#656d76] dark:text-[#848d97] line-clamp-2">
                        {track.description}
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <div className="h-1.5 w-full rounded-full bg-[#f6f8fa] dark:bg-[#21262d] overflow-hidden">
                        <div
                          className="h-full bg-[#2ea043] rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectTrack(track)}
                        className="w-full py-2 rounded-xl bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-xs font-bold text-[#0969da] dark:text-[#58a6ff] active:scale-95 transition"
                      >
                        Filter Catalog by {track.primaryTag}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Track Problems Quick App Tiles */}
            {tracks.map((track) => (
              <div
                key={`list-${track.id}`}
                className="rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] overflow-hidden"
              >
                <div className="px-4 py-2.5 bg-[#f6f8fa] dark:bg-[#21262d]/60 border-b border-[#d0d7de] dark:border-[#30363d] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                    {track.title}
                  </span>
                  <span className="text-[10px] font-mono text-[#656d76] dark:text-[#848d97]">
                    {track.curatedProblems.length} tasks
                  </span>
                </div>
                <div className="divide-y divide-[#d0d7de]/70 dark:divide-[#30363d]">
                  {track.curatedProblems.map((cp) => {
                    const live = problemStatusMap.get(cp.slug);
                    const status = live?.userStatus;
                    return (
                      <Link
                        key={cp.slug}
                        to={`/workspace/${cp.slug}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 min-h-[52px] active:bg-[#eaeef2] dark:active:bg-[#21262d] transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {status === 'SOLVED' ? (
                            <CheckCircle2 className="w-4 h-4 text-[#1a7f37] dark:text-[#3fb950] shrink-0" />
                          ) : status === 'ATTEMPTED' ? (
                            <Clock className="w-4 h-4 text-[#9a6700] dark:text-[#d29922] shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-[#8c959f] shrink-0" />
                          )}
                          <span className="text-xs font-semibold text-[#1f2328] dark:text-[#f0f6fc] truncate">
                            {cp.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {getCompactDifficultyBadge(cp.difficulty)}
                          <ChevronRight className="w-4 h-4 text-[#8c959f]" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-[#656d76] dark:text-[#848d97]">
            <Loader2 className="w-6 h-6 animate-spin text-[#0969da] dark:text-[#58a6ff]" />
            <span className="text-xs font-mono">Loading problems...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center space-y-3 bg-white dark:bg-[#161b22] rounded-2xl border border-[#d0d7de] dark:border-[#30363d]">
            <AlertCircle className="w-7 h-7 text-[#cf222e] dark:text-[#f85149] mx-auto" />
            <p className="text-xs font-semibold">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0969da] text-white"
            >
              Retry
            </button>
          </div>
        ) : problems.length === 0 ? (
          <div className="p-10 text-center space-y-3 bg-white dark:bg-[#161b22] rounded-2xl border border-[#d0d7de] dark:border-[#30363d]">
            <BookOpen className="w-8 h-8 text-[#8c959f] mx-auto" />
            <p className="text-xs font-bold">No challenges match these filters</p>
            <button
              type="button"
              onClick={onClearFilters}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d]"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Native App-Style List Tiles */
          <div className="space-y-3">
            <div className="rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] overflow-hidden divide-y divide-[#d0d7de]/70 dark:divide-[#30363d] shadow-2xs">
              {problems.map((prob, idx) => {
                const indexNumber = (page - 1) * pagination.limit + idx + 1;
                return (
                  <Link
                    key={prob.id}
                    to={`/workspace/${prob.slug || prob.id}`}
                    className="flex items-center justify-between gap-3 px-3.5 py-3 min-h-[60px] active:bg-[#eaeef2] dark:active:bg-[#21262d] transition"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="pt-0.5 shrink-0">
                        {prob.userStatus === 'SOLVED' ? (
                          <CheckCircle2 className="w-4.5 h-4.5 text-[#1a7f37] dark:text-[#3fb950]" />
                        ) : prob.userStatus === 'ATTEMPTED' ? (
                          <Clock className="w-4.5 h-4.5 text-[#9a6700] dark:text-[#d29922]" />
                        ) : (
                          <Circle className="w-4.5 h-4.5 text-[#afb8c1] dark:text-[#484f58]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-bold text-[#1f2328] dark:text-[#f0f6fc] truncate">
                          <span className="font-mono text-[11px] text-[#656d76] dark:text-[#848d97] mr-1">
                            {indexNumber}.
                          </span>
                          {prob.title}
                        </div>

                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {getCompactDifficultyBadge(prob.difficulty)}
                          {prob.tags[0] && (
                            <span className="text-[10px] font-mono text-[#656d76] dark:text-[#848d97] bg-[#f6f8fa] dark:bg-[#0d1117] px-1.5 py-0.5 rounded border border-[#d0d7de]/60 dark:border-[#30363d]">
                              {prob.tags[0]}
                            </span>
                          )}
                          {prob.userStatus === 'SOLVED' && prob.bestRuntimeMs !== undefined ? (
                            <span className="text-[10px] font-mono text-[#1a7f37] dark:text-[#3fb950] flex items-center gap-0.5">
                              <Zap className="w-2.5 h-2.5" /> {prob.bestRuntimeMs}ms
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-[#8c959f]">
                              {prob.acceptanceRate ? `${prob.acceptanceRate}%` : '58%'} pass
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => onOpenShareModal(e, prob)}
                        aria-label="Share problem"
                        className="p-2 rounded-lg text-[#656d76] dark:text-[#848d97] active:bg-[#d0d7de]/50 dark:active:bg-[#30363d]"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      {prob.isCustomPractice && (
                        <button
                          type="button"
                          onClick={(e) => onDeletePractice(e, prob.id)}
                          aria-label="Delete practice problem"
                          className="p-2 rounded-lg text-[#cf222e] dark:text-[#f85149]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <ChevronRight className="w-4 h-4 text-[#8c959f] dark:text-[#6e7681]" />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-1 pb-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="h-10 px-4 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-xs font-bold flex items-center gap-1 disabled:opacity-40 active:scale-95 transition"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-xs font-mono font-semibold text-[#656d76] dark:text-[#848d97]">
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages || loading}
                  className="h-10 px-4 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-xs font-bold flex items-center gap-1 disabled:opacity-40 active:scale-95 transition"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Native Filter & Sort Bottom Sheet */}
      <MobileBottomSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filter Challenges"
        subtitle={`${pagination.total} challenges in catalog`}
        footer={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onClearFilters();
                setIsFilterSheetOpen(false);
              }}
              className="flex-1 h-11 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] active:scale-95 transition"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(false)}
              className="flex-[2] h-11 rounded-xl bg-[#0969da] text-white text-xs font-bold shadow-xs active:scale-95 transition"
            >
              Show Results
            </button>
          </div>
        }
      >
        {/* Difficulty Chips */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#848d97]">
            Difficulty Level
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as const).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => {
                  setDifficulty(level);
                  setPage(1);
                }}
                className={`h-10 rounded-xl text-xs font-bold border active:scale-95 transition ${
                  difficulty === level
                    ? 'bg-[#0969da] border-[#0969da] text-white'
                    : 'bg-[#f6f8fa] dark:bg-[#0d1117] border-[#d0d7de] dark:border-[#30363d] text-[#1f2328] dark:text-[#e6edf3]'
                }`}
              >
                {level === 'ALL' ? 'All' : level.charAt(0) + level.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#848d97]">
            Sort Order
          </label>
          <div className="grid grid-cols-2 gap-2">
            {sortOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setSortBy(opt.value);
                  setPage(1);
                }}
                className={`px-3 py-2.5 rounded-xl text-xs font-semibold border text-left active:scale-95 transition ${
                  sortBy === opt.value
                    ? 'bg-[#0969da]/10 border-[#0969da] text-[#0969da] dark:text-[#58a6ff]'
                    : 'bg-[#f6f8fa] dark:bg-[#0d1117] border-[#d0d7de] dark:border-[#30363d] text-[#1f2328] dark:text-[#e6edf3]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Tags */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#848d97]">
            Algorithm Topic
          </label>
          <div className="flex flex-wrap gap-2">
            {topicTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSelectedTag(tag);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border active:scale-95 transition ${
                  selectedTag === tag
                    ? 'bg-[#8250df] border-[#8250df] text-white'
                    : 'bg-[#f6f8fa] dark:bg-[#0d1117] border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#848d97]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </MobileBottomSheet>
    </div>
  );
}
