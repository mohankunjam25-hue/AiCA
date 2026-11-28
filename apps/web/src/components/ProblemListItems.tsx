import React from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  AlertCircle,
  Share2,
  Trash2,
  Code2,
  ArrowRight,
  Circle,
} from 'lucide-react';
import { ProblemListItem, ProblemDifficulty } from '@aica/shared';

function getDifficultyBadge(diff: ProblemDifficulty) {
  switch (diff) {
    case 'EASY':
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#dafbe1] dark:bg-[#2ea04326] text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b66] dark:border-[#2ea0434d]">
          Easy
        </span>
      );
    case 'MEDIUM':
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#fff8c5] dark:bg-[#bb800926] text-[#9a6700] dark:text-[#d29922] border border-[#d4a72c66] dark:border-[#bb80094d]">
          Medium
        </span>
      );
    case 'HARD':
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#ffebe9] dark:bg-[#f8514926] text-[#cf222e] dark:text-[#f85149] border border-[#ff818266] dark:border-[#f851494d]">
          Hard
        </span>
      );
  }
}

export interface ProblemItemRowProps {
  prob: ProblemListItem;
  indexNumber: number;
  onSelectTag: (tag: string) => void;
  onOpenShareModal: (e: React.MouseEvent, prob: ProblemListItem) => void;
  onDeletePractice: (e: React.MouseEvent, id: string) => void;
  onOpenCodeModal: (prob: ProblemListItem) => void;
}

const areProblemPropsEqual = (prev: ProblemItemRowProps, next: ProblemItemRowProps) =>
  prev.indexNumber === next.indexNumber &&
  prev.prob.id === next.prob.id &&
  prev.prob.userStatus === next.prob.userStatus &&
  prev.prob.acceptanceRate === next.prob.acceptanceRate &&
  prev.prob.totalSubmissions === next.prob.totalSubmissions &&
  prev.prob.bestRuntimeMs === next.prob.bestRuntimeMs &&
  prev.prob.lastVerdict === next.prob.lastVerdict &&
  prev.onSelectTag === next.onSelectTag &&
  prev.onOpenShareModal === next.onOpenShareModal &&
  prev.onDeletePractice === next.onDeletePractice &&
  prev.onOpenCodeModal === next.onOpenCodeModal;

export const ProblemGridCard = React.memo(function ProblemGridCard({
  prob,
  indexNumber,
  onSelectTag,
  onOpenShareModal,
  onDeletePractice,
  onOpenCodeModal,
}: ProblemItemRowProps) {
  return (
    <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-xl p-4.5 hover:border-[#0969da] dark:hover:border-[#58a6ff] hover:shadow-sm transition group flex flex-col justify-between">
      <div>
        {/* Top Status & Difficulty Row */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {prob.userStatus === 'SOLVED' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dafbe1] dark:bg-[#2ea04326] text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b66] dark:border-[#2ea0434d]">
                <CheckCircle2 className="w-3 h-3" /> Solved
              </span>
            ) : prob.userStatus === 'ATTEMPTED' ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fff8c5] dark:bg-[#bb800926] text-[#9a6700] dark:text-[#d29922] border border-[#d4a72c66] dark:border-[#bb80094d]">
                <Clock className="w-3 h-3" /> In-Progress
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97] border border-[#d0d7de] dark:border-[#30363d]">
                <Sparkles className="w-3 h-3 text-indigo-500" /> New
              </span>
            )}

            {prob.isCustomPractice && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                🧪 Practice Lab
              </span>
            )}
          </div>

          {getDifficultyBadge(prob.difficulty)}
        </div>

        {/* Problem Title */}
        <Link
          to={`/workspace/${prob.slug || prob.id}`}
          className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff] transition line-clamp-2"
        >
          <span className="font-mono text-[#656d76] dark:text-[#848d97] text-xs mr-1.5">
            {indexNumber}.
          </span>
          {prob.title}
        </Link>

        {/* Personal Metrics Annotation */}
        {prob.userStatus === 'SOLVED' && prob.bestRuntimeMs !== undefined && (
          <div className="mt-2 text-[11px] font-mono text-[#1a7f37] dark:text-[#3fb950] flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" /> Best: {prob.bestRuntimeMs}ms
            </span>
            {prob.bestMemoryKb ? <span>• {Math.round(prob.bestMemoryKb / 1024)} MB</span> : null}
          </div>
        )}

        {prob.userStatus === 'ATTEMPTED' && prob.lastVerdict && (
          <div className="mt-2 text-[11px] font-mono text-[#cf222e] dark:text-[#f85149] flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>Last Error: {prob.lastVerdict.replace(/_/g, ' ')}</span>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-3">
          {prob.tags.slice(0, 3).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onSelectTag(t)}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#f6f8fa] dark:bg-[#0d1117] text-[#656d76] dark:text-[#848d97] border border-[#d0d7de]/70 dark:border-[#30363d] hover:border-[#0969da] transition cursor-pointer"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Card Bottom Actions */}
      <div className="mt-4 pt-3 border-t border-[#d0d7de]/60 dark:border-[#30363d] flex items-center justify-between">
        <span className="text-[11px] font-mono text-[#656d76] dark:text-[#848d97]">
          {prob.acceptanceRate ? `${prob.acceptanceRate}%` : '58%'} pass • {prob.totalSubmissions || 24} runs
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => onOpenShareModal(e, prob)}
            className="p-1.5 rounded-md hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] text-[#656d76] dark:text-[#848d97] hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
            title="Share Challenge (WhatsApp / Direct Link)"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {prob.isCustomPractice && (
            <button
              type="button"
              onClick={(e) => onDeletePractice(e, prob.id)}
              className="p-1.5 rounded-md hover:bg-[#ffebe9] dark:hover:bg-[#f8514926] text-[#656d76] dark:text-[#848d97] hover:text-[#cf222e] dark:hover:text-[#f85149] transition cursor-pointer"
              title="Delete Practice Problem"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {prob.solutionCode && (
            <button
              onClick={() => onOpenCodeModal(prob)}
              className="p-1.5 rounded-md hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] text-[#656d76] dark:text-[#848d97] hover:text-[#0969da] dark:hover:text-[#58a6ff] transition cursor-pointer"
              title="View Verified Code"
            >
              <Code2 className="w-3.5 h-3.5" />
            </button>
          )}

          <Link
            to={`/workspace/${prob.slug || prob.id}`}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1 ${
              prob.userStatus === 'SOLVED'
                ? 'bg-[#1f883d]/10 text-[#1a7f37] hover:bg-[#1a7f37] hover:text-white dark:bg-[#2ea04326] dark:text-[#3fb950]'
                : prob.userStatus === 'ATTEMPTED'
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-white'
                : 'bg-[#0969da]/10 text-[#0969da] hover:bg-[#0969da] hover:text-white dark:bg-[#388bfd26] dark:text-[#58a6ff]'
            }`}
          >
            <span>
              {prob.userStatus === 'SOLVED' ? 'Solve Again' : prob.userStatus === 'ATTEMPTED' ? 'Resume' : 'Start'}
            </span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}, areProblemPropsEqual);

export const ProblemTableRow = React.memo(function ProblemTableRow({
  prob,
  indexNumber,
  onSelectTag,
  onOpenShareModal,
  onDeletePractice,
  onOpenCodeModal,
}: ProblemItemRowProps) {
  return (
    <div className="grid grid-cols-12 px-4 py-3 items-center hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition group text-xs">
      {/* Column 1: Status Badge */}
      <div className="col-span-2 sm:col-span-1 flex justify-center">
        {prob.userStatus === 'SOLVED' ? (
          <span
            title="Solved"
            className="inline-flex items-center justify-center p-1 rounded-full bg-[#dafbe1] dark:bg-[#2ea04326] text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b66] dark:border-[#2ea0434d]"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </span>
        ) : prob.userStatus === 'ATTEMPTED' ? (
          <span
            title={`Attempted: ${prob.lastVerdict || 'In Progress'}`}
            className="inline-flex items-center justify-center p-1 rounded-full bg-[#fff8c5] dark:bg-[#bb800926] text-[#9a6700] dark:text-[#d29922] border border-[#d4a72c66] dark:border-[#bb80094d]"
          >
            <Clock className="w-3.5 h-3.5" />
          </span>
        ) : (
          <span
            title="Unattempted"
            className="inline-flex items-center justify-center p-1 rounded-full bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97] border border-[#d0d7de] dark:border-[#30363d]"
          >
            <Circle className="w-3 h-3 text-[#d0d7de] dark:text-[#30363d]" />
          </span>
        )}
      </div>

      {/* Column 2: Title & Topics */}
      <div className="col-span-5 sm:col-span-5 md:col-span-6 min-w-0 pr-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Link
            to={`/workspace/${prob.slug || prob.id}`}
            className="font-semibold text-[#1f2328] dark:text-[#f0f6fc] group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff] truncate block transition"
          >
            <span className="font-mono text-[#656d76] dark:text-[#848d97] text-[11px] mr-1.5">
              {indexNumber}.
            </span>
            {prob.title}
          </Link>
          {prob.isCustomPractice && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 shrink-0">
              🧪 Practice
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {prob.tags.slice(0, 3).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onSelectTag(t)}
              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#f6f8fa] dark:bg-[#0d1117] text-[#656d76] dark:text-[#848d97] border border-[#d0d7de]/70 dark:border-[#30363d] hover:border-[#0969da] hover:text-[#0969da] transition cursor-pointer"
            >
              {t}
            </button>
          ))}

          {/* Best runtime pill if solved */}
          {prob.userStatus === 'SOLVED' && prob.bestRuntimeMs !== undefined && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#dafbe1] dark:bg-[#2ea04326] text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b66] dark:border-[#2ea0434d] flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />
              {prob.bestRuntimeMs}ms
            </span>
          )}

          {/* Last error pill if attempted */}
          {prob.userStatus === 'ATTEMPTED' && prob.lastVerdict && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#ffebe9] dark:bg-[#f8514926] text-[#cf222e] dark:text-[#f85149] border border-[#ff818266] dark:border-[#f851494d]">
              {prob.lastVerdict.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </div>

      {/* Column 3: Difficulty */}
      <div className="col-span-3 sm:col-span-2 flex justify-center">
        {getDifficultyBadge(prob.difficulty)}
      </div>

      {/* Column 4: Acceptance Rate */}
      <div className="hidden sm:flex sm:col-span-2 md:col-span-2 flex-col items-center justify-center font-mono">
        <span className="text-[#1f2328] dark:text-[#f0f6fc] font-semibold text-xs">
          {prob.acceptanceRate ? `${prob.acceptanceRate}%` : '58.4%'}
        </span>
        <span className="text-[10px] text-[#656d76] dark:text-[#848d97]">
          {prob.totalSubmissions || 24} runs
        </span>
      </div>

      {/* Column 5: Action Link & Code Preview Button */}
      <div className="col-span-2 sm:col-span-2 md:col-span-1 flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={(e) => onOpenShareModal(e, prob)}
          className="p-1 rounded hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] text-[#656d76] dark:text-[#848d97] hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          title="Share Challenge (WhatsApp / Direct Link)"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>

        {prob.isCustomPractice && (
          <button
            type="button"
            onClick={(e) => onDeletePractice(e, prob.id)}
            className="p-1 rounded hover:bg-[#ffebe9] dark:hover:bg-[#f8514926] text-[#656d76] dark:text-[#848d97] hover:text-[#cf222e] dark:hover:text-[#f85149] transition cursor-pointer"
            title="Delete Practice Problem"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {prob.solutionCode && (
          <button
            onClick={() => onOpenCodeModal(prob)}
            className="p-1 rounded hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] text-[#656d76] dark:text-[#848d97] hover:text-[#0969da] dark:hover:text-[#58a6ff] transition cursor-pointer"
            title="View Verified Code"
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>
        )}

        <Link
          to={`/workspace/${prob.slug || prob.id}`}
          className={`px-2 py-1 rounded-md text-[11px] font-semibold transition flex items-center gap-1 ${
            prob.userStatus === 'SOLVED'
              ? 'bg-[#1f883d]/10 text-[#1a7f37] hover:bg-[#1a7f37] hover:text-white dark:bg-[#2ea04326] dark:text-[#3fb950]'
              : prob.userStatus === 'ATTEMPTED'
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500 hover:text-white'
              : 'bg-[#0969da]/10 text-[#0969da] hover:bg-[#0969da] hover:text-white dark:bg-[#388bfd26] dark:text-[#58a6ff]'
          }`}
        >
          <span>
            {prob.userStatus === 'SOLVED' ? 'Solve' : prob.userStatus === 'ATTEMPTED' ? 'Resume' : 'Start'}
          </span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}, areProblemPropsEqual);
