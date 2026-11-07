import { useState, useEffect } from 'react';

export interface OnlineStatusOptions {
  /**
   * Duration in milliseconds to keep `wasOffline = true` after reconnecting.
   * Default: 3500ms.
   */
  reconnectGraceMs?: number;
  /**
   * Optional callback fired when reconnecting to network.
   */
  onReconnect?: () => void;
  /**
   * Optional callback fired when disconnecting from network.
   */
  onDisconnect?: () => void;
}

export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  offlineSince: Date | null;
}

/**
 * Hook to observe real-time browser online/offline status with graceful reconnection detection.
 * Safe for SSR and non-browser test environments.
 */
export function useOnlineStatus(options: OnlineStatusOptions = {}): OnlineStatus {
  const { reconnectGraceMs = 3500, onReconnect, onDisconnect } = options;

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
      return navigator.onLine;
    }
    return true;
  });

  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [offlineSince, setOfflineSince] = useState<Date | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      setOfflineSince(null);
      setWasOffline(true);
      if (onReconnect) onReconnect();

      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        setWasOffline(false);
      }, reconnectGraceMs);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineSince(new Date());
      setWasOffline(false);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (onDisconnect) onDisconnect();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [reconnectGraceMs, onReconnect, onDisconnect]);

  return {
    isOnline,
    wasOffline,
    offlineSince
  };
}
