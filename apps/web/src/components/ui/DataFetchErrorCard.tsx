import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface DataFetchErrorCardProps {
  title?: string;
  message?: string;
  onRetry?: () => void | Promise<void>;
  isRetrying?: boolean;
  compact?: boolean;
  className?: string;
}

export function DataFetchErrorCard({
  title = 'Failed to load data',
  message = 'Could not synchronize with the backend service. Please verify your connection.',
  onRetry,
  isRetrying = false,
  compact = false,
  className = ''
}: DataFetchErrorCardProps) {
  if (compact) {
    return (
      <div
        className={`flex items-center justify-between gap-3 p-3 rounded-xl bg-[#ffebe9] dark:bg-[#f851491a] border border-[#ff818266] dark:border-[#f8514940] text-xs ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="w-4 h-4 text-[#cf222e] dark:text-[#f85149] shrink-0" />
          <span className="text-[#cf222e] dark:text-[#f85149] font-medium truncate">{message}</span>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-[#21262d] border border-[#ff818280] dark:border-[#f8514966] text-[#cf222e] dark:text-[#f85149] hover:bg-[#fff0ee] dark:hover:bg-[#30363d] font-semibold transition shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Retrying...' : 'Retry'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#161b22] border border-[#ff818266] dark:border-[#f8514940] text-center space-y-4 shadow-xs max-w-md mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#ffebe9] dark:bg-[#f8514926] border border-[#ff818266] dark:border-[#f851494d] flex items-center justify-center mx-auto text-[#cf222e] dark:text-[#f85149]">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-bold text-[#1f2328] dark:text-[#f0f6fc]">{title}</h3>
        <p className="text-xs text-[#57606a] dark:text-[#8b949e] leading-relaxed max-w-sm mx-auto">{message}</p>
      </div>

      {onRetry && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0969da] hover:bg-[#0854ad] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Connecting...' : 'Try Again'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
