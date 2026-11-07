import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseClipboardOptions {
  timeout?: number;
}

export interface UseClipboardReturn {
  copy: (text: string) => Promise<boolean>;
  copied: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Custom hook for 1-click clipboard operations with automatic status reset.
 * Perfect for test case inputs, code snippets, and shareable URLs.
 *
 * @param options.timeout Milliseconds before 'copied' state resets back to false (default: 2000ms)
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const { timeout = 2000 } = options;
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      reset();

      if (typeof window === 'undefined') {
        return false;
      }

      // Modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          timeoutRef.current = setTimeout(() => {
            setCopied(false);
          }, timeout);
          return true;
        } catch (err: any) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setCopied(false);
        }
      }

      // Fallback for older browsers / insecure contexts
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          setCopied(true);
          timeoutRef.current = setTimeout(() => {
            setCopied(false);
          }, timeout);
          return true;
        } else {
          throw new Error('execCommand copy returned false');
        }
      } catch (err: any) {
        const copyError = err instanceof Error ? err : new Error('Failed to copy to clipboard');
        setError(copyError);
        setCopied(false);
        return false;
      }
    },
    [timeout, reset]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { copy, copied, error, reset };
}
