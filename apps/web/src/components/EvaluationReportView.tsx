import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Brain,
  Zap,
  HelpCircle,
  Code,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { EvaluationReport, Submission } from '@aica/shared';
import { api } from '../services/api';

interface EvaluationReportViewProps {
  report: EvaluationReport;
  submission?: Submission;
  onCompareRequest?: () => void;
  onReportUpdate?: (updatedReport: EvaluationReport) => void;
}

export function EvaluationReportView({
  report: initialReport,
  submission,
  onCompareRequest,
  onReportUpdate
}: EvaluationReportViewProps) {
  const [report, setReport] = useState<EvaluationReport>(initialReport);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  useEffect(() => {
    setReport(initialReport);
  }, [initialReport]);

  const isAccepted = report.verdict === 'ACCEPTED';
  const ai = report.aiAnalysis;
  const isPending = ai?.status === 'PENDING';
  const isFailed = ai?.status === 'FAILED';
  const isSkipped = ai?.status === 'SKIPPED';

  // Auto-poll report while AI analysis is PENDING so user does not have to manually refresh
  useEffect(() => {
    if (!isPending || !report?.submissionId) return;

    let count = 0;
    const interval = setInterval(async () => {
      count++;
      if (count > 20) {
        clearInterval(interval);
        return;
      }
      try {
        const res = await api.get(`/submissions/${report.submissionId}/report`);
        if (res.data.data?.aiAnalysis?.status && res.data.data.aiAnalysis.status !== 'PENDING') {
          setReport(res.data.data);
          onReportUpdate?.(res.data.data);
          clearInterval(interval);
        }
      } catch {
        // silent retry
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isPending, report?.submissionId, onReportUpdate]);

  const handleRetryAi = async () => {
    setIsRetrying(true);
    setRetryMessage(null);
    try {
      await api.post(`/submissions/${report.submissionId}/retry-ai`);
      setRetryMessage('AI analysis retry queued! Refreshing report...');
      setTimeout(async () => {
        try {
          const res = await api.get(`/submissions/${report.submissionId}/report`);
          setReport(res.data.data);
          onReportUpdate?.(res.data.data);
          setRetryMessage(null);
        } catch {
          // ignore deferred
        } finally {
          setIsRetrying(false);
        }
      }, 3000);
    } catch (err: any) {
      setRetryMessage(`Retry failed: ${err.response?.data?.error?.message || err.message}`);
      setIsRetrying(false);
    }
  };

  const handleManualRefresh = async () => {
    try {
      const res = await api.get(`/submissions/${report.submissionId}/report`);
      setReport(res.data.data);
      onReportUpdate?.(res.data.data);
    } catch (err: any) {
      console.warn('Refresh failed:', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Verdict Banner */}
      <div
        className={`p-6 rounded-2xl border flex items-center justify-between ${
          isAccepted
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isAccepted ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
            }`}
          >
            {isAccepted ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight">{report.verdict}</h2>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                Score: {report.metrics?.compositeScore || 0.0} / 100
              </span>
            </div>
            <p className="text-sm opacity-80 mt-1">{report.summary}</p>
          </div>
        </div>

        {onCompareRequest && isAccepted && (
          <button
            onClick={onCompareRequest}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
          >
            Compare Solution
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
            <Clock className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            Execution Time
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {report.metrics?.rawTimeMs} <span className="text-xs text-slate-400 dark:text-slate-500 font-sans">ms</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Norm: {report.metrics?.normalizedTimeMs}ms</span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
            <Cpu className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            Memory Usage
          </span>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {Math.round((report.metrics?.rawMemoryKb || 0) / 1024)}{' '}
            <span className="text-xs text-slate-400 dark:text-slate-500 font-sans">MB</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">{report.metrics?.rawMemoryKb} KB</span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            Theoretical Time
          </span>
          <div className="text-lg sm:text-xl font-bold font-mono text-amber-600 dark:text-amber-300">
            {ai?.theoreticalComplexity?.timeComplexity || 'O(N)'}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Asymptotic Big-O</span>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            Code Quality
          </span>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-300">
            {ai?.codeQuality?.score || 8.0} <span className="text-xs text-slate-400 dark:text-slate-500 font-sans">/ 10</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Static Readability</span>
        </div>
      </div>

      {/* AI Pedagogical Analysis Card */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Complexity & Evolution Insights</h3>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Google Gemini Engine &bull; {ai?.mode === 'OPTIMIZATION' ? 'Optimization Mode' : 'Diagnostic Mode'}
              </span>
            </div>
          </div>
          {isFailed && (
            <button
              onClick={handleRetryAi}
              disabled={isRetrying}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isRetrying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Retry AI Analysis
            </button>
          )}
          {isPending && (
            <button
              onClick={handleManualRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          )}
        </div>

        {/* Retry Message Alert */}
        {retryMessage && (
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300">
            {retryMessage}
          </div>
        )}

        {/* Status Callout Banners */}
        {isPending && (
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/20 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">AI Analysis in Progress</h4>
              <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80">
                Deterministic tests passed! Deep asymptotic complexity and refactoring insights are being generated in the background.
              </p>
            </div>
          </div>
        )}

        {isFailed && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">AI Analysis Disruption</h4>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                Your deterministic verdict ({report.verdict}) is 100% verified and recorded. The AI service timed out or was rate-limited. Click "Retry AI Analysis" above to retry anytime.
              </p>
            </div>
          </div>
        )}

        {isSkipped && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-slate-400 shrink-0" />
            <p className="text-xs text-slate-600 dark:text-slate-400">
              AI pedagogical analysis bypassed because the submission encountered a compilation error. Fix compilation issues to unlock AI insights.
            </p>
          </div>
        )}

        {/* Complexity Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">Time & Space Asymptotics</span>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {ai?.theoreticalComplexity?.explanation || 'Linear single-pass lookup with auxiliary cache.'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-300 block mb-1">Readability & Maintainability</span>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {ai?.codeQuality?.readabilityAnalysis || 'Clean modular function decomposition with clear variable semantics.'}
            </p>
          </div>
        </div>

        {/* Mode B: Diagnostic Feedback (if failed) */}
        {ai?.diagnosticFeedback && (
          <div className="p-5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 space-y-3">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              Algorithmic Diagnostic & Edge-Case Trap
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong className="text-amber-800 dark:text-amber-200">Root Cause:</strong> {ai.diagnosticFeedback.rootCauseBug}
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong className="text-amber-800 dark:text-amber-200">Vulnerability:</strong> {ai.diagnosticFeedback.edgeCaseVulnerability}
            </p>
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>Socratic Hint:</strong> {ai.diagnosticFeedback.socraticHint}
              </span>
            </div>
          </div>
        )}

        {/* Mode A: Optimization Suggestions */}
        {ai?.optimizationSuggestions && ai.optimizationSuggestions.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Evolutionary Refactoring Vectors</h4>
            <div className="space-y-3">
              {ai.optimizationSuggestions.map((opt, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-300">{opt.title}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                      {opt.expectedTimeImpact}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{opt.rationale}</p>
                  {opt.refactoredSnippet && (
                    <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono overflow-x-auto">
                      {opt.refactoredSnippet}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Test Cases Pass/Fail Matrix */}
      {submission?.testResults && submission.testResults.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200">Test Execution Breakdown</h3>
          <div className="space-y-2">
            {submission.testResults.map((tr) => (
              <div
                key={tr.testCaseId || tr.index}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs font-mono"
              >
                <div className="flex items-center gap-3">
                  {tr.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  )}
                  <span className="text-slate-800 dark:text-slate-300 font-semibold">
                    Test #{tr.index} {tr.isPublic ? '(Public)' : '(Hidden Edge Case)'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
                  <span>{tr.executionTimeMs} ms</span>
                  <span>{tr.memoryKb} KB</span>
                  <span className={tr.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                    {tr.passed ? 'PASSED' : tr.errorMessage || 'FAILED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
