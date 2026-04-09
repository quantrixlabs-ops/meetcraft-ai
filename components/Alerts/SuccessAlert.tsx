import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { useErrorContext } from '../../context/ErrorContext';

const SuccessAlert: React.FC = () => {
  const { success, clearSuccess } = useErrorContext();

  useEffect(() => {
    if (success) {
      const timeout = setTimeout(() => {
        clearSuccess();
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [success, clearSuccess]);

  if (!success) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-slide-in">
      <div className="bg-green-50 border-l-4 border-green-500 rounded-lg shadow-lg p-4 flex gap-3 items-start">
        <span className="shrink-0 text-green-500"><CheckCircle className="h-5 w-5" /></span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-green-800">Success!</h3>
          <p className="text-sm text-green-700 mt-1">{success}</p>
        </div>
        <button
          className="shrink-0 text-green-400 hover:text-green-600"
          onClick={clearSuccess}
          aria-label="Close success alert"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SuccessAlert;
