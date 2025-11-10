
export const validateAlphanumeric = (value: string, fieldName: string) => {
  if (!value.trim()) {
    return `${fieldName} is required`;
  }
  
  // Allow alphanumeric characters, spaces, hyphens, and apostrophes
  const alphanumericRegex = /^[a-zA-Z0-9\s\-']+$/;
  if (!alphanumericRegex.test(value)) {
    return `${fieldName} must contain only letters, numbers, spaces, hyphens, and apostrophes`;
  }
  
  if (value.trim().length < 2) {
    return `${fieldName} must be at least 2 characters long`;
  }
  
  if (value.trim().length > 39) {
    return `${fieldName} must be less than 40 characters`;
  }
  
  return null;
};

export const validateEmail = (email: string) => {
  if (!email.trim()) {
    return "Email is required";
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }
  
  if (email.length > 100) {
    return "Email address is too long, must be less than 100 characters";
  }
  
  return null;
};

export const validateMobile = (mobile: string): string | undefined => {
  if (!mobile) return "Mobile number is required.";
  if (!/^\d+$/.test(mobile)) return "Mobile number must contain only digits.";
  if (mobile.length !== 10) return "Mobile number must be exactly 10 digits.";
  return undefined;
};


export const validatePositiveNumber = (value: number, fieldName: string, min: number = 0, max?: number) => {
  if (value < min) {
    return `${fieldName} must be at least ${min}`;
  }
  
  if (max !== undefined && value > max) {
    return `${fieldName} cannot exceed ${max}`;
  }
  
  if (!Number.isInteger(value)) {
    return `${fieldName} must be a whole number`;
  }
  
  return null;
};

export const validateRequired = (value: string | number | undefined | null, fieldName: string) => {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateSelect = (value: string | number | undefined, fieldName: string) => {
  if (!value || value === '' || value === 0) {
    return `Please select a ${fieldName.toLowerCase()}`;
  }
  return null;
};
