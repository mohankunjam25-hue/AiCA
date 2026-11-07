import { Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export function NetworkStatusIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus({ reconnectGraceMs: 3500 });

  if (isOnline && !wasOffline) {
    return null;
  }

  if (!isOnline) {
    return (
      <aside
        aria-live="assertive"
        role="alert"
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#cf222e] text-white text-xs font-medium shadow-2xl border border-red-700/50 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 max-w-[92vw] sm:max-w-md pointer-events-auto select-none"
      >
        <WifiOff className="w-4 h-4 text-red-200 shrink-0 animate-pulse" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5 leading-snug">
          <span className="font-bold">Offline:</span>
          <span className="text-red-100">Your code is automatically saved locally in drafts.</span>
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-live="polite"
      role="status"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a7f37] text-white text-xs font-semibold shadow-2xl border border-emerald-700/50 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 pointer-events-auto select-none"
    >
      <Wifi className="w-4 h-4 text-emerald-200 shrink-0" />
      <span>Back online! Reconnected to network.</span>
    </aside>
  );
}
