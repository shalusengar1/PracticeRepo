import { UserData } from '@/types/user'; // Import the interface

const nameRegex = /^[a-zA-Z\s-]*$/; // Allows letters, spaces, hyphens

export const validateFormData = (formData: UserData): string[] => {
    const errors: string[] = [];
  
    if (!formData.firstName?.trim()) {
      errors.push("First Name is required.");
    } else if (!nameRegex.test(formData.firstName)) {
      errors.push("First Name can only contain letters, spaces, and hyphens.");
    } else if (formData.firstName.length > 40) {
      errors.push("First Name must be less than or equal to 40 characters.");
    }
    if (!formData.lastName?.trim()) {
      errors.push("Last Name is required.");
    } else if (!nameRegex.test(formData.lastName)) {
      errors.push("Last Name can only contain letters, spaces, and hyphens.");
    } else if (formData.lastName.length > 40) {
      errors.push("Last Name must be less than or equal to 40 characters.");
    }
    if (!formData.email) {
      errors.push("Email is required.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Invalid email format.");
    } else if (formData.email.length > 100) {
      errors.push("Email must be less than or equal to 100 characters.");
    }
    if (!formData.phone) {
      errors.push("Phone Number is required.");
    } else if (!/^[0-9]{10}$/.test(formData.phone)) {
      errors.push("Phone Number must be 10 digits.");
    }
    if (formData.alternateContact && !/^[0-9]{10}$/.test(formData.alternateContact)) {
      errors.push("Alternate Contact must be 10 digits.");
    }
    if (!formData.role) errors.push("Role is required.");
    if (!formData.status) errors.push("Status is required.");
  
    // Basic date validation (YYYY-MM-DD format)
    if (formData.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(formData.dateOfBirth)) {
      errors.push("Invalid Date of Birth format. Use YYYY-MM-DD.");
    }
    if (formData.joiningDate && !/^\d{4}-\d{2}-\d{2}$/.test(formData.joiningDate)) {
      errors.push("Invalid Joining Date format. Use YYYY-MM-DD.");
    }

    // Validate that joining date is not before date of birth
    if (formData.dateOfBirth && formData.joiningDate && 
        /^\d{4}-\d{2}-\d{2}$/.test(formData.dateOfBirth) && 
        /^\d{4}-\d{2}-\d{2}$/.test(formData.joiningDate)) {
      if (new Date(formData.joiningDate) < new Date(formData.dateOfBirth)) {
        errors.push("Joining date cannot be earlier than the date of birth.");
      }
    }
  
    // Password matching (only if password is provided)
    if (formData.password && formData.password !== formData.confirmPassword) {
      errors.push("New password and confirm password do not match.");
    }
  
    // Address validation (if address is provided)
    if (formData.address && formData.address.trim()) {
      if (formData.address.trim().length > 255) {
        errors.push("Address must be less than 255 characters.");
      }
    }
    return errors;
  };
