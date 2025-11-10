import api from '@/api/axios';
import { Amenity } from '@/types/amenity';
import { isAxiosError } from 'axios'; // Import isAxiosError

const API_URL = '/admin/amenities';

const getAmenities = async (enabledOnly: boolean = false): Promise<Amenity[]> => {
  try {
    let url = API_URL;
    if (enabledOnly === true) {
      url += '?enabled=true';
    } else if (enabledOnly === false) {
      url += '?enabled=false'; // Explicitly fetch disabled amenities if requested
    }
    const response = await api.get(url);
    return response.data;
  } catch (error: any) {
    if (isAxiosError(error)) { // Use imported isAxiosError
      console.error('Error fetching amenities:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch amenities. Please try again.');
    } else {
      console.error('Unexpected error fetching amenities:', error);
      throw new Error('An unexpected error occurred. Please try again later.');
    }
  }
};

const createAmenity = async (amenityData: Omit<Amenity, 'id' | 'enabled'>): Promise<Amenity> => {
  try {
    const response = await api.post(API_URL, amenityData);
    return response.data;
  } catch (error: any) {
    if (isAxiosError(error)) { // Use imported isAxiosError
      console.error('Error creating amenity:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create amenity. Please check the data and try again.');
    } else {
      console.error('Unexpected error creating amenity:', error);
      throw new Error('An unexpected error occurred while creating the amenity. Please try again later.');
    }
  }
};

const updateAmenity = async (id: number, amenityData: Partial<Omit<Amenity, 'id'>>): Promise<Amenity> => {
    try {
      const response = await api.put(`${API_URL}/${id}`, amenityData);
      return response.data;
    } catch (error: any) {
      if (isAxiosError(error)) {
        console.error('Error updating amenity:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to update amenity. Please try again.');
      } else {
        console.error('Unexpected error updating amenity:', error);
        throw new Error('An unexpected error occurred while updating the amenity. Please try again later.');
      }
    }
  };

const updateAmenitiesBulk = async (updates: { id: number; enabled: boolean }[]): Promise<Amenity[]> => {
  try {
    const response = await api.put(`${API_URL}/bulk`, updates); // New endpoint: /admin/amenities/bulk
    return response.data;
  } catch (error: any) {
    if (isAxiosError(error)) {
      console.error('Error updating amenities in bulk:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update amenities. Please try again.');
    } else {
      console.error('Unexpected error updating amenities in bulk:', error);
      throw new Error('An unexpected error occurred while updating amenities. Please try again later.');
    }
  }
};

const deleteAmenity = async (id: number): Promise<void> => {
  try {
    await api.delete(`${API_URL}/${id}`);
  } catch (error: any) {
    if (isAxiosError(error)) {
      console.error('Error deleting amenity:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to delete amenity. Please try again.');
    } else {
      console.error('Unexpected error deleting amenity:', error);
      throw new Error('An unexpected error occurred while deleting the amenity. Please try again later.');
    }
  }
};

const amenityService = {
  getAmenities,
  createAmenity,
  updateAmenity,
  updateAmenitiesBulk,
  deleteAmenity, // Add the new function here
};

export default amenityService;
