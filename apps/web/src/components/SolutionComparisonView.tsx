import { DiffEditor } from '@monaco-editor/react';
import { ArrowLeftRight, Clock, Cpu, Zap, Brain } from 'lucide-react';
import { SolutionComparison, LANGUAGE_CONFIGS, SupportedLanguage } from '@aica/shared';
import { useThemeStore } from '../store/useThemeStore';

interface SolutionComparisonViewProps {
  comparison: SolutionComparison;
}

export function SolutionComparisonView({ comparison }: SolutionComparisonViewProps) {
  const isDark = useThemeStore((s) => s.isDark);
  const { submissionA: subA, submissionB: subB, deltaAnalysis: delta } = comparison;

  const langA = subA.language as SupportedLanguage;
  const monacoLang = LANGUAGE_CONFIGS[langA]?.monacoLanguage || 'python';

  return (
    <div className="space-y-5">
      {/* Comparison Delta Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Solution Evolution ({subA.username} vs {subB.username})
            </h2>
          </div>
        </div>

        {/* Delta Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1 font-sans">
              <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              Runtime Delta
            </span>
            <div className="text-base font-bold font-mono">
              <span className="text-slate-700 dark:text-slate-300">{subA.executionTimeMs}ms</span>
              <span className="text-slate-400 dark:text-slate-500 mx-1.5">&rarr;</span>
              <span className={delta.executionTimeDiffMs <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                {subB.executionTimeMs}ms ({delta.executionTimeDiffMs > 0 ? '+' : ''}
                {delta.executionTimeDiffMs}ms)
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              {subA.timeComplexity} vs {subB.timeComplexity}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1 font-sans">
              <Cpu className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
              Memory Delta
            </span>
            <div className="text-base font-bold font-mono">
              <span className="text-slate-700 dark:text-slate-300">{Math.round(subA.memoryUsedKb / 1024)}MB</span>
              <span className="text-slate-400 dark:text-slate-500 mx-1.5">&rarr;</span>
              <span className={delta.memoryDiffKb <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                {Math.round(subB.memoryUsedKb / 1024)}MB ({delta.memoryDiffKb > 0 ? '+' : ''}
                {Math.round(delta.memoryDiffKb / 1024)}MB)
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              {subA.spaceComplexity} vs {subB.spaceComplexity}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1 font-sans">
              <Zap className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              Quality Score Delta
            </span>
            <div className="text-base font-bold font-mono">
              <span className="text-slate-700 dark:text-slate-300">{subA.qualityScore}/10</span>
              <span className="text-slate-400 dark:text-slate-500 mx-1.5">&rarr;</span>
              <span className={delta.qualityScoreDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                {subB.qualityScore}/10 ({delta.qualityScoreDiff > 0 ? '+' : ''}
                {delta.qualityScoreDiff})
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Score: {subA.compositeScore} vs {subB.compositeScore}
            </span>
          </div>
        </div>
      </div>

      {/* Trade-Off Narrative */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs">
          <Brain className="w-3.5 h-3.5" />
          Algorithmic Trade-Off Review
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
          {delta.tradeOffSummary ||
            'Solution B optimizes asymptotic runtime by replacing repetitive scans with an indexed hash map, reducing time complexity while maintaining equivalent space efficiency.'}
        </p>
      </div>

      {/* Side-by-Side Monaco Diff Editor */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950 shadow-xs">
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-mono font-semibold">
          <span className="text-indigo-600 dark:text-indigo-400">Approach A ({subA.language})</span>
          <span className="text-purple-600 dark:text-purple-400">Approach B ({subB.language})</span>
        </div>
        <div className="h-[400px]">
          <DiffEditor
            height="100%"
            language={monacoLang}
            theme={isDark ? "vs-dark" : "light"}
            original={subA.code}
            modified={subB.code}
            options={{
              fontSize: 12,
              readOnly: true,
              automaticLayout: true,
              fontFamily: "'Fira Code', monospace"
            }}
          />
        </div>
      </div>
    </div>
  );
}
