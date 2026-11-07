import { describe, it, expect, vi } from 'vitest';
import { getErrorMessage } from '../apps/web/src/utils/errorUtils';
import { useToastStore, toast } from '../apps/web/src/store/useToastStore';
import { ErrorBoundary } from '../apps/web/src/components/ui/ErrorBoundary';

describe('UI Resilience & Error Handling Invariants', () => {
  describe('1. Error Message Extraction Utility (getErrorMessage)', () => {
    it('should extract error message from standard Error instance', () => {
      const err = new Error('Database query timed out');
      expect(getErrorMessage(err)).toBe('Database query timed out');
    });

    it('should translate Axios Network Error into friendly text', () => {
      const err = new Error('Network Error');
      expect(getErrorMessage(err)).toContain('Network connection lost');
    });

    it('should extract message from nested Axios response data.error.message', () => {
      const axiosErr = {
        response: {
          data: {
            error: {
              message: 'Invalid submission ID specified.'
            }
          }
        }
      };
      expect(getErrorMessage(axiosErr)).toBe('Invalid submission ID specified.');
    });

    it('should extract message from Axios response data.message', () => {
      const axiosErr = {
        response: {
          data: {
            message: 'Problem title already taken in catalog.'
          }
        }
      };
      expect(getErrorMessage(axiosErr)).toBe('Problem title already taken in catalog.');
    });

    it('should return raw string if error is a string', () => {
      expect(getErrorMessage('Custom error message')).toBe('Custom error message');
    });

    it('should return fallback if error is null or empty', () => {
      expect(getErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred. Please try again.');
    });
  });

  describe('2. Toast Store & Notification System', () => {
    it('should enqueue error, success, and info toasts', () => {
      useToastStore.getState().clearAll();

      toast.error('Submission failed');
      toast.success('Code copied');
      toast.info('Draft auto-saved');

      const toasts = useToastStore.getState().toasts;
      expect(toasts.length).toBe(3);
      expect(toasts[0].type).toBe('error');
      expect(toasts[0].message).toBe('Submission failed');
      expect(toasts[1].type).toBe('success');
      expect(toasts[2].type).toBe('info');
    });

    it('should deduplicate identical error messages in queue', () => {
      useToastStore.getState().clearAll();

      toast.error('Network disconnect');
      toast.error('Network disconnect'); // duplicate

      const toasts = useToastStore.getState().toasts;
      expect(toasts.length).toBe(1);
    });

    it('should remove toast by ID', () => {
      useToastStore.getState().clearAll();
      const id = toast.info('Ephemeral info message', 0); // 0 = no auto-dismiss
      expect(useToastStore.getState().toasts.length).toBe(1);

      toast.dismiss(id);
      expect(useToastStore.getState().toasts.length).toBe(0);
    });

    it('should auto-dismiss toast after duration timeout', () => {
      vi.useFakeTimers();
      useToastStore.getState().clearAll();

      toast.error('Temporary error', 3000);
      expect(useToastStore.getState().toasts.length).toBe(1);

      vi.advanceTimersByTime(3000);
      expect(useToastStore.getState().toasts.length).toBe(0);
      vi.useRealTimers();
    });
  });

  describe('3. ErrorBoundary State & Lifecycle Invariants', () => {
    it('should derive state with incidentId on error', () => {
      const err = new Error('Render crash test');
      const state = ErrorBoundary.getDerivedStateFromError(err);

      expect(state.hasError).toBe(true);
      expect(state.error).toBe(err);
      expect(state.incidentId).toMatch(/^ERR-[A-Z0-9]+$/);
    });
  });
});
