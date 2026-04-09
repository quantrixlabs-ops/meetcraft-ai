import React, { useEffect } from 'react';
import { XCircle } from 'lucide-react';
import { useErrorContext } from '../../context/ErrorContext';

const ErrorAlert: React.FC = () => {
  const { error, clearError, retryCount, maxRetries } = useErrorContext();

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => {
        clearError();
      }, 6000);
      return () => clearTimeout(timeout);
    }
  }, [error, clearError]);

  if (!error) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-slide-in">
      <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg p-4 flex gap-3 items-start">
        <span className="shrink-0 text-red-500"><XCircle className="h-5 w-5" /></span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-800">
            Error{retryCount > 0 ? ` (Attempt ${retryCount + 1}/${maxRetries})` : ''}
          </h3>
          <p className="text-sm text-red-700 mt-1">{error}</p>
          {retryCount > 0 && retryCount < maxRetries && (
            <div className="text-xs text-red-600 mt-2">ℹ️ Retries remaining: {maxRetries - retryCount}</div>
          )}
        </div>
        <button
          className="shrink-0 text-red-400 hover:text-red-600"
          onClick={clearError}
          aria-label="Close error alert"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ErrorAlert;
