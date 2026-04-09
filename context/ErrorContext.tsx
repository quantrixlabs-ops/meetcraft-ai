import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ErrorContextType {
  error: string | null;
  success: string | null;
  warning: string | null;
  info: string | null;
  isLoading: boolean;
  retryCount: number;
  maxRetries: number;
  setError: (msg: string) => void;
  setSuccess: (msg: string) => void;
  setWarning: (msg: string) => void;
  setInfo: (msg: string) => void;
  clearError: () => void;
  clearSuccess: () => void;
  clearWarning: () => void;
  clearInfo: () => void;
  clearAll: () => void;
  setLoading: (loading: boolean) => void;
  incrementRetry: () => void;
  resetRetry: () => void;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
  const [error, setErrorState] = useState<string | null>(null);
  const [success, setSuccessState] = useState<string | null>(null);
  const [warning, setWarningState] = useState<string | null>(null);
  const [info, setInfoState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const setError = useCallback((msg: string) => {
    setErrorState(msg);
    console.error('[ErrorContext]', msg);
  }, []);
  const setSuccess = useCallback((msg: string) => {
    setSuccessState(msg);
    console.log('[ErrorContext]', msg);
  }, []);
  const setWarning = useCallback((msg: string) => {
    setWarningState(msg);
    console.warn('[ErrorContext]', msg);
  }, []);
  const setInfo = useCallback((msg: string) => {
    setInfoState(msg);
    console.info('[ErrorContext]', msg);
  }, []);
  const clearError = useCallback(() => setErrorState(null), []);
  const clearSuccess = useCallback(() => setSuccessState(null), []);
  const clearWarning = useCallback(() => setWarningState(null), []);
  const clearInfo = useCallback(() => setInfoState(null), []);
  const clearAll = useCallback(() => {
    setErrorState(null);
    setSuccessState(null);
    setWarningState(null);
    setInfoState(null);
  }, []);
  const setLoading = useCallback((loading: boolean) => setIsLoading(loading), []);
  const incrementRetry = useCallback(() => setRetryCount((c) => c + 1), []);
  const resetRetry = useCallback(() => setRetryCount(0), []);

  return (
    <ErrorContext.Provider
      value={{
        error,
        success,
        warning,
        info,
        isLoading,
        retryCount,
        maxRetries,
        setError,
        setSuccess,
        setWarning,
        setInfo,
        clearError,
        clearSuccess,
        clearWarning,
        clearInfo,
        clearAll,
        setLoading,
        incrementRetry,
        resetRetry,
      }}
    >
      {children}
    </ErrorContext.Provider>
  );
};

export function useErrorContext() {
  const ctx = useContext(ErrorContext);
  if (!ctx) throw new Error('useErrorContext must be used within ErrorProvider');
  return ctx;
}
