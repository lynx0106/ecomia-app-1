/**
 * Hook for using server actions with error handling and retry logic
 */

import { useCallback, useState } from 'react';
import { useToast } from '@/components/ui/ToastProvider';
import { logger, withRetry } from '@/lib/logging';

type ActionFn<T, R> = (args: T) => Promise<R>;

type UseActionOptions = {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
  retryOptions?: {
    maxAttempts?: number;
    delay?: number;
    backoff?: boolean;
  };
};

export function useServerAction<T, R>(
  actionFn: ActionFn<T, R>,
  options?: UseActionOptions
) {
  const { toast, toastError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (args: T) => {
      setIsLoading(true);
      try {
        let result: R;

        if (options?.retryOptions) {
          result = await withRetry(() => actionFn(args), options.retryOptions);
        } else {
          result = await actionFn(args);
        }

        if (options?.showSuccessToast !== false) {
          toast({
            title: 'Éxito',
            description: options?.successMessage || 'Operación completada',
            tone: 'success',
          });
        }

        options?.onSuccess?.(result);
        return result;
      } catch (error) {
        logger.error('Server action failed', error instanceof Error ? error : undefined, {
          action: actionFn.name,
        });

        toastError(error, actionFn.name);
        options?.onError?.(error instanceof Error ? error : new Error(String(error)));
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [actionFn, options, toast, toastError]
  );

  return [execute, { isLoading }] as const;
}

/**
 * Hook for using async functions with loading state and error handling
 */
export function useAsyncAction<T, R>(
  asyncFn: (args: T) => Promise<R>,
  options?: UseActionOptions
) {
  const { toast, toastError } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (args: T) => {
      setIsLoading(true);
      try {
        let result: R;

        if (options?.retryOptions) {
          result = await withRetry(() => asyncFn(args), options.retryOptions);
        } else {
          result = await asyncFn(args);
        }

        if (options?.showSuccessToast !== false) {
          toast({
            title: 'Éxito',
            description: options?.successMessage || 'Operación completada',
            tone: 'success',
          });
        }

        options?.onSuccess?.(result);
        return result;
      } catch (error) {
        logger.error('Async action failed', error instanceof Error ? error : undefined, {
          action: asyncFn.name,
        });

        toastError(error, asyncFn.name);
        options?.onError?.(error instanceof Error ? error : new Error(String(error)));
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFn, options, toast, toastError]
  );

  return [execute, { isLoading }] as const;
}
