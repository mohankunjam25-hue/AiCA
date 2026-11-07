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
        return 'Network connection lost. Please check your internet connection.';
      }
      return err.message;
    }
  }

  return fallback;
}
