import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  level?: 'global' | 'route' | 'widget';
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  incidentId: string;
  isDetailsExpanded: boolean;
  copied: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      incidentId: '',
      isDetailsExpanded: false,
      copied: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    return {
      hasError: true,
      error,
      incidentId: `ERR-${randomHex}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Log exception for debugging/monitoring
    console.error(`[ErrorBoundary:${this.props.level || 'route'}] Incident:`, error, errorInfo);
  }

  handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      incidentId: '',
      isDetailsExpanded: false
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleCopyIncident = () => {
    const { incidentId, error, errorInfo } = this.state;
    const reportText = `AiCA Error Incident: ${incidentId}\nMessage: ${error?.message || 'Unknown'}\nStack: ${error?.stack || ''}\nComponentStack: ${errorInfo?.componentStack || ''}`;
    navigator.clipboard?.writeText(reportText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  render() {
    const { hasError, error, incidentId, isDetailsExpanded, copied } = this.state;
    const { children, fallback, level = 'route' } = this.props;

    if (!hasError) {
      return children;
    }

    if (fallback) {
      if (typeof fallback === 'function') {
        return fallback(error || new Error('Unknown error'), this.handleReset);
      }
      return fallback;
    }

    // Level: Widget (Small embedded component failure)
    if (level === 'widget') {
      return (
        <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 text-xs text-red-800 dark:text-red-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="truncate">This component encountered a rendering error.</span>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="px-2.5 py-1 rounded bg-white dark:bg-red-900/50 border border-red-300 dark:border-red-800 font-semibold hover:bg-red-50 transition shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      );
    }

    // Level: Global or Route
    const isGlobal = level === 'global';

    return (
      <div
        className={`${
          isGlobal ? 'min-h-screen' : 'flex-1 min-h-[460px]'
        } flex items-center justify-center p-4 sm:p-8 bg-[#f6f8fa] dark:bg-[#010409] text-[#1f2328] dark:text-[#e6edf3] font-sans transition-colors duration-200`}
      >
        <div className="max-w-xl w-full bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
          {/* Header Badge & Title */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#ffebe9] dark:bg-[#f8514926] border border-[#ff818266] dark:border-[#f851494d] flex items-center justify-center mx-auto text-[#cf222e] dark:text-[#f85149] shadow-xs">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                Something went wrong
              </h1>
              <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-1 max-w-sm mx-auto leading-relaxed">
                An unexpected interface error interrupted this view. Your session and unsaved code drafts remain safely preserved.
              </p>
            </div>
          </div>

          {/* Incident Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[#57606a] dark:text-[#8b949e]">Incident ID:</span>
              <span className="font-bold text-[#0969da] dark:text-[#58a6ff]">{incidentId}</span>
            </div>
            <button
              type="button"
              onClick={this.handleCopyIncident}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-sans hover:bg-[#eaeef2] dark:hover:bg-[#21262d] transition cursor-pointer text-[#57606a] dark:text-[#8b949e]"
              title="Copy incident details for support"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#1a7f37] dark:text-[#3fb950]" />
                  <span className="text-[#1a7f37] dark:text-[#3fb950] font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Report</span>
                </>
              )}
            </button>
          </div>

          {/* Expandable Technical Details (Helpful in dev & debugging) */}
          {error?.message && (
            <div className="rounded-xl border border-[#d0d7de] dark:border-[#30363d] overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ isDetailsExpanded: !prev.isDetailsExpanded }))}
                className="w-full flex items-center justify-between p-3 bg-[#f6f8fa] dark:bg-[#161b22] text-[#57606a] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] font-semibold transition cursor-pointer"
              >
                <span>Diagnostic Information</span>
                {isDetailsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {isDetailsExpanded && (
                <div className="p-3 bg-[#ffffff] dark:bg-[#0d1117] font-mono text-[11px] text-[#cf222e] dark:text-[#ff7b72] max-h-48 overflow-y-auto space-y-1">
                  <div className="font-bold">{error.message}</div>
                  {error.stack && (
                    <pre className="text-[10px] text-[#57606a] dark:text-[#8b949e] whitespace-pre-wrap leading-tight mt-1">
                      {error.stack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0969da] hover:bg-[#0854ad] text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
            <a
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] text-[#1f2328] dark:text-[#e6edf3] text-xs font-semibold shadow-2xs transition"
            >
              <Home className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </a>
          </div>
        </div>
      </div>
    );
  }
}
