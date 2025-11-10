
export const formatBackendError = (error: any): string => {
  // Handle validation errors (422)
  if (error.response?.status === 422 && error.response?.data?.errors) {
    const errors = error.response.data.errors;
    const errorMessages: string[] = [];
    
    Object.keys(errors).forEach(field => {
      if (Array.isArray(errors[field])) {
        errorMessages.push(...errors[field]);
      } else {
        errorMessages.push(errors[field]);
      }
    });
    
    return errorMessages.join(', ');
  }
  
  // Handle array of error messages directly
  if (Array.isArray(error.response?.data?.message)) {
    return error.response.data.message.join(', ');
  }
  
  // Handle array of errors at root level
  if (Array.isArray(error.response?.data)) {
    return error.response.data.join(', ');
  }

  if (Array.isArray(error.response?.error)) {
    return error.response.data.join(', ');
  }
  
  // Handle single message errors
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  // Handle network errors
  if (error.code === 'NETWORK_ERROR' || !error.response) {
    return 'Network error. Please check your connection and try again.';
  }
  
  // Handle HTTP status errors
  if (error.response?.status) {
    switch (error.response.status) {
      case 401:
        return 'Authentication failed. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This action conflicts with existing data. Please refresh and try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
        return 'Service temporarily unavailable. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return `Error ${error.response.status}: ${error.response.statusText || 'Unknown error'}`;
    }
  }
  
  // Fallback
  return error.message || 'An unexpected error occurred. Please try again.';
};

export const handleApiError = (error: any, defaultMessage: string = 'An error occurred') => {
  console.error('API Error:', error);
  return formatBackendError(error) || defaultMessage;
};

export const isValidationError = (error: any): boolean => {
  return error?.response?.status === 422;
};

export const isNetworkError = (error: any): boolean => {
  return error?.code === 'NETWORK_ERROR' || !error?.response;
};
