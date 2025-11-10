export interface VenueValidationErrors {
  venue_name?: string;
  address?: string;
  description?: string;
  latitude?: string;
  longitude?: string;
}

export const validateVenueName = (name: string): string | undefined => {
  if (!name.trim()) {
    return "Venue name is required.";
  }
  // Allow alphanumeric characters and spaces
  const alphanumericRegex = /^[a-zA-Z0-9\s]+$/;
  if (!alphanumericRegex.test(name)) {
    return "Venue name must contain only letters, numbers, and spaces.";
  }
  if (name.trim().length < 3) {
    return "Venue name must be at least 3 characters long.";
  }
  if (name.trim().length > 49) {
    return "Venue name must be less than 50 characters.";
  }
  return undefined;
};

export const validateVenueAddress = (address: string): string | undefined => {
  if (!address.trim()) {
    return "Address is required.";
  }
  if (address.trim().length < 10) {
    return "Address must be at least 10 characters long.";
  }
  if (address.trim().length > 255) {
    return "Address must be less than 255 characters.";
  }
  return undefined;
};

export const validateVenueDescription = (description: string): string | undefined => {
  // Description is optional, so only validate if it has a value
  if (description.trim() && description.trim().length > 500) {
    return "Description must be less than 500 characters.";
  }
  if (description.trim() && description.trim().length < 10 && description.trim().length > 0) {
    return "Description must be at least 10 characters long if provided.";
  }
  return undefined;
};

export const validateLatitude = (latitude: number | null): string | undefined => {
  if (latitude === null || latitude === undefined) {
    return undefined; // Latitude is optional
  }
  if (typeof latitude !== 'number' || isNaN(latitude)) {
    return "Latitude must be a valid number.";
  }
  if (latitude < -90 || latitude > 90) {
    return "Latitude must be between -90 and 90 degrees.";
  }
  return undefined;
};

export const validateLongitude = (longitude: number | null): string | undefined => {
  if (longitude === null || longitude === undefined) {
    return undefined; // Longitude is optional
  }
  if (typeof longitude !== 'number' || isNaN(longitude)) {
    return "Longitude must be a valid number.";
  }
  if (longitude < -180 || longitude > 180) {
    return "Longitude must be between -180 and 180 degrees.";
  }
  return undefined;
};

export const validateCoordinates = (latitude: number | null, longitude: number | null): string | undefined => {
  const latError = validateLatitude(latitude);
  const lngError = validateLongitude(longitude);
  
  if (latError) return latError;
  if (lngError) return lngError;
  
  // If one coordinate is provided, both should be provided
  if ((latitude !== null && longitude === null) || (latitude === null && longitude !== null)) {
    return "Both latitude and longitude must be provided together.";
  }
  
  return undefined;
};