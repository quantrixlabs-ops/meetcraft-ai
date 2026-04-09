import React from 'react';

interface RetryButtonProps {
  onRetry: () => void;
  retryCount: number;
  maxRetries: number;
  isLoading: boolean;
}

const RetryButton: React.FC<RetryButtonProps> = ({ onRetry, retryCount, maxRetries, isLoading }) => {
  if (retryCount === 0 || retryCount >= maxRetries) return null;
  return (
    <button
      className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded disabled:opacity-60 disabled:cursor-not-allowed mt-2"
      onClick={onRetry}
      disabled={isLoading}
      type="button"
    >
      Retry ({maxRetries - retryCount} attempts left)
    </button>
  );
};

export default RetryButton;
