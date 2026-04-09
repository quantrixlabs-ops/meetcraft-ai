import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useErrorContext } from '../../context/ErrorContext';

const WarningAlert: React.FC = () => {
  const { warning, clearWarning } = useErrorContext();

  useEffect(() => {
    if (warning) {
      const timeout = setTimeout(() => {
        clearWarning();
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [warning, clearWarning]);

  if (!warning) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-slide-in">
      <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg shadow-lg p-4 flex gap-3 items-start">
        <span className="flex-shrink-0 text-yellow-500"><AlertTriangle className="h-5 w-5" /></span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-800">Warning</h3>
          <p className="text-sm text-yellow-700 mt-1">{warning}</p>
        </div>
        <button
          className="flex-shrink-0 text-yellow-400 hover:text-yellow-600"
          onClick={clearWarning}
          aria-label="Close warning alert"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default WarningAlert;
