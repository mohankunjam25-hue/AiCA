/**
 * Determines whether an error was caused by a network disconnection,
 * offline browser state, socket hang-up, or request timeout.
 */
export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as any;

  if (err.isNetworkError) return true;
  if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') return true;
  if (err.message === 'Network Error' || err.message?.toLowerCase().includes('network')) return true;
  if (err.response?.status === 0 || err.response?.data?.error?.code === 'NETWORK_ERROR' || err.response?.data?.error?.code === 'OFFLINE') return true;

  if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined' && !window.navigator.onLine) {
    return true;
  }

  return false;
}

/**
 * Safely extracts a clean, user-friendly, human-readable error message
 * from any error payload (Axios error, Error instance, API response, string, or unknown).
 */
export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred. Please try again.'): string {
  if (!error) return fallback;

  if (typeof error === 'string') {
    const trimmed = error.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  if (typeof error === 'object' && error !== null) {
    const err = error as any;

    // Handle Network Disconnects & Offline states with high priority
    if (isNetworkError(err)) {
      if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined' && !window.navigator.onLine) {
        return 'You are currently offline. Please check your internet connection and try again.';
      }
      if (err.response?.data?.error?.message) {
        return err.response.data.error.message;
      }
      if (err.networkMessage) {
        return err.networkMessage;
      }
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    // Axios response data formats from NestJS / Express / REA API
    if (err.response?.data) {
      const data = err.response.data;

      // Format: { error: { message: "..." } }
      if (typeof data.error?.message === 'string' && data.error.message.trim()) {
        return data.error.message;
      }
      // Format: { message: "..." }
      if (typeof data.message === 'string' && data.message.trim()) {
        return data.message;
      }
      // Format: { error: "..." }
      if (typeof data.error === 'string' && data.error.trim()) {
        return data.error;
      }
    }

    // Standard JavaScript Error instance
    if (typeof err.message === 'string' && err.message.trim()) {
      // Clean common axios network errors
      if (err.message === 'Network Error') {
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      }
      return err.message;
    }
  }

  return fallback;
}
