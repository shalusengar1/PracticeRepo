// Validation logic for Partner forms

export interface PartnerFormData {
  name: string;
  specialization?: string;
  email: string;
  mobile: string;
  status?: "Active" | "Inactive";
  payType: "Fixed" | "Revenue Share";
  payAmount?: number;
  payPercentage?: number;
  tdsPercentage?: number | null;
  paymentTerms: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mobileRegex = /^\+?[0-9]{10,15}$/;

export const validatePartnerForm = (formData: PartnerFormData): string[] => {
  const errors: string[] = [];

  // Name
  if (!formData.name?.trim()) {
    errors.push("Partner name is required.");
  } else if (formData.name.length > 50) {
    errors.push("Partner name cannot exceed 50 characters.");
  }

  // Email
  if (!formData.email?.trim()) {
    errors.push("Email is required.");
  } else if (!emailRegex.test(formData.email)) {
    errors.push("Invalid email format.");
  } else if (formData.email.length > 100) {
    errors.push("Email must be less than 100 characters.");
  }

  // Mobile
  if (!formData.mobile?.trim()) {
    errors.push("Phone number is required.");
  } else if (!mobileRegex.test(formData.mobile)) {
    errors.push("Invalid phone number (must be 10-15 digits, optionally starting with +).");
  }

  // Pay Type
  if (!formData.payType) {
    errors.push("Pay type is required.");
  }

  // Pay Amount (if Fixed)
  if (formData.payType === 'Fixed') {
    if (formData.payAmount !== undefined && formData.payAmount !== null) {
      if (isNaN(Number(formData.payAmount)) || Number(formData.payAmount) < 0) {
        errors.push("Pay Amount must be a valid non-negative number.");
      } else if (Number(formData.payAmount) > 99999999) {
        errors.push("Pay Amount cannot exceed 8 digits.");
      }
    }
  }

  // Pay Percentage (if Revenue Share)
  if (formData.payType === 'Revenue Share') {
    if (formData.payPercentage !== undefined && formData.payPercentage !== null) {
      if (isNaN(Number(formData.payPercentage)) || Number(formData.payPercentage) < 0 || Number(formData.payPercentage) > 100) {
        errors.push("Pay Percentage must be a number between 0 and 100.");
      }
    }
  }

  // TDS Percentage
  if (formData.tdsPercentage !== undefined && formData.tdsPercentage !== null) {
    if (isNaN(Number(formData.tdsPercentage)) || Number(formData.tdsPercentage) < 0 || Number(formData.tdsPercentage) > 100) {
      errors.push("TDS Percentage must be a number between 0 and 100.");
    }
  }

  // Payment Terms
  if (!formData.paymentTerms) {
    errors.push("Payment terms is required.");
  }

  return errors;
}; 