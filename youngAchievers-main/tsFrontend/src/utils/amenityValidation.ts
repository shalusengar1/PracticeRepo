import { validateRequired } from './formValidation';

export interface AmenityValidationErrors {
  name?: string;
  icon?: string;
  category?: string;
}

export const validateAmenityName = (name: string): string | null => {
  const required = validateRequired(name, 'Name');
  if (required) return required;

  if (name.length > 50) {
    return 'Name must be less than 50 characters';
  }


  const nameRegex = /^[a-zA-Z0-9\s]*$/;
  if (!nameRegex.test(name)) {
    return 'Name should not contain special characters.';
  }

  return null;
};

export const validateAmenityIcon = (icon: string): string | null => {
  const required = validateRequired(icon, 'Icon');
  if (required) return required;

  if (icon.length > 255) {
    return 'Icon must be less than 255 characters';
  }

  return null;
};

export const validateAmenityCategory = (category: string): string | null => {
  const required = validateRequired(category, 'Category');
  if (required) return required;

  const validCategories = ['basic', 'comfort', 'additional'];
  if (!validCategories.includes(category)) {
    return 'Category must be one of: basic, comfort, additional';
  }

  return null;
};

export const validateAmenity = (amenity: { name: string; icon: string; category: string }): AmenityValidationErrors => {
  const errors: AmenityValidationErrors = {};

  const nameError = validateAmenityName(amenity.name);
  if (nameError) errors.name = nameError;

  const iconError = validateAmenityIcon(amenity.icon);
  if (iconError) errors.icon = iconError;

  const categoryError = validateAmenityCategory(amenity.category);
  if (categoryError) errors.category = categoryError;

  return errors;
};
