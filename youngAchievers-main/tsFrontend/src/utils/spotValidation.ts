// src/utils/spotValidation.ts

export interface SpotValidationErrors {
  spot_name?: string;
  area?: string;
  capacity?: string;
  operative_days?: string;
  start_time?: string;
  end_time?: string;
}

export const validateSpotName = (name: string): string | undefined => {
  if (!name || name.trim() === "") {
    return "Spot name is required.";
  }
  if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
    return "Spot name must be alphanumeric and contain no symbols.";
  }
  if (name.trim().length > 50) {
    return "Spot name must be 50 characters or less.";
  }
  return undefined;
};

// Note: validatePositiveNumber from '@/utils/formValidation' will be used for numeric value checks.
// The "typing limit" for area and capacity will be handled by maxLength on input fields.

export const validateOperativeDays = (days: number[]): string | undefined => {
  if (!days || days.length === 0) {
    return "At least one operative day must be selected.";
  }
  return undefined;
};

export const validateTimes = (startTime: string, endTime: string): string | undefined => {
  if (!startTime) {
    return "Start time is required.";
  }
  if (!endTime) {
    return "End time is required.";
  }
  // Simple time comparison (assumes HH:MM format)
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  const startTimeInMinutes = startHours * 60 + startMinutes;
  const endTimeInMinutes = endHours * 60 + endMinutes;

  if (startTimeInMinutes >= endTimeInMinutes) {
    return "End time must be after start time.";
  }
  return undefined;
};