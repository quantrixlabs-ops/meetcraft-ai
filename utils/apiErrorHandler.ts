interface ApiErrorResult {
  code: number;
  userMessage: string;
  technicalMessage: string;
  isRetryable: boolean;
  shouldRedirectToLogin: boolean;
}

export function handleApiError(error: unknown, context: string = ''): ApiErrorResult {
  let code = 0;
  let userMessage = 'An unexpected error occurred.';
  let technicalMessage = '';
  let isRetryable = false;
  let shouldRedirectToLogin = false;

  if (typeof error === 'object' && error !== null && 'response' in error) {
    // Axios-like error
    const err = error as any;
    code = err.response?.status || 0;
    technicalMessage = err.response?.data?.message || err.message || String(error);
    switch (code) {
      case 400: {
        // Show backend validation error if available
        const backendMsg = err.response?.data?.message || err.response?.data?.error || err.response?.data;
        if (typeof backendMsg === 'string' && backendMsg.length < 200) {
          userMessage = backendMsg;
        } else {
          userMessage = 'Invalid input. Please check your data and try again.';
        }
        break;
      }
      case 401:
      case 403:
        userMessage = 'Session expired. Please log in again.';
        shouldRedirectToLogin = true;
        break;
      case 404:
        userMessage = 'Resource not found.';
        break;
      case 422:
        userMessage = 'Validation failed. Please check your input.';
        break;
      case 429:
        userMessage = 'Too many requests. Please wait before trying again.';
        isRetryable = true;
        break;
      case 500:
        userMessage = 'Server error. Please try again later.';
        break;
      case 503:
        userMessage = 'Service unavailable. Please try again later.';
        break;
      default:
        userMessage = 'An error occurred. Please try again.';
    }
  } else if (error instanceof Error) {
    technicalMessage = error.message;
    if (error.message.includes('Network Error') || error.message.includes('Failed to fetch')) {
      userMessage = 'Connection failed. Please check your internet and retry.';
      isRetryable = true;
    } else {
      userMessage = error.message;
    }
  } else {
    technicalMessage = String(error);
  }

  if (context) {
    technicalMessage = `[${context}] ${technicalMessage}`;
  }

  return { code, userMessage, technicalMessage, isRetryable, shouldRedirectToLogin };
}
