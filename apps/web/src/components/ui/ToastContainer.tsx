import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore, ToastItem } from '../../store/useToastStore';

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 sm:top-5 sm:right-5 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
    >
      {toasts.map((item: ToastItem) => {
        const isError = item.type === 'error';
        const isSuccess = item.type === 'success';
        const isWarning = item.type === 'warning';

        return (
          <div
            key={item.id}
            role={isError || isWarning ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-top-2 text-xs ${
              isError
                ? 'bg-[#ffebe9] dark:bg-[#1f1214] border-[#ff818280] text-[#cf222e] dark:text-[#ff7b72]'
                : isSuccess
                ? 'bg-[#dafbe1] dark:bg-[#102015] border-[#4ac26b80] text-[#1a7f37] dark:text-[#3fb950]'
                : isWarning
                ? 'bg-[#fff8c5] dark:bg-[#272115] border-[#d4a72c80] text-[#9a6700] dark:text-[#d29922]'
                : 'bg-white dark:bg-[#161b22] border-[#d0d7de] dark:border-[#30363d] text-[#1f2328] dark:text-[#e6edf3]'
            }`}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {isError && <AlertCircle className="w-4 h-4 text-[#cf222e] dark:text-[#f85149]" />}
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-[#1a7f37] dark:text-[#3fb950]" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-[#9a6700] dark:text-[#d29922]" />}
              {!isError && !isSuccess && !isWarning && <Info className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff]" />}
            </div>

            {/* Message Body */}
            <div className="flex-1 min-w-0 font-medium leading-relaxed break-words">
              {item.message}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="shrink-0 p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
