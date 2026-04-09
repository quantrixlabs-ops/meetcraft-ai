import React, { useEffect } from 'react';
import { Info } from 'lucide-react';
import { useErrorContext } from '../../context/ErrorContext';

const InfoAlert: React.FC = () => {
  const { info, clearInfo } = useErrorContext();

  useEffect(() => {
    if (info) {
      const timeout = setTimeout(() => {
        clearInfo();
      }, 4000);
      return () => clearTimeout(timeout);
    }
  }, [info, clearInfo]);

  if (!info) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-slide-in">
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow-lg p-4 flex gap-3 items-start">
        <span className="shrink-0 text-blue-500"><Info className="h-5 w-5" /></span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-800">Info</h3>
          <p className="text-sm text-blue-700 mt-1">{info}</p>
        </div>
        <button
          className="shrink-0 text-blue-400 hover:text-blue-600"
          onClick={clearInfo}
          aria-label="Close info alert"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default InfoAlert;
