import api from '@/api/axios'; // Assuming you have an axios instance set up
import { FixedAsset } from '@/types//asset'; // Import the interface

const API_URL = '/admin/assets'; // Adjust to your actual API endpoint

export const getAssets = async (): Promise<FixedAsset[]> => {
  const response = await api.get(`${API_URL}`);
  return response.data;
};

export const addAsset = async (asset: Omit<FixedAsset, 'id'>): Promise<FixedAsset> => {
  const response = await api.post(`${API_URL}`, asset);
  return response.data;
};

export const updateAsset = async (asset: FixedAsset): Promise<FixedAsset> => {
  const response = await api.put(`${API_URL}/${asset.id}`, asset);
  return response.data;
};

export const deleteAsset = async (id: string): Promise<void> => {
  await api.delete(`${API_URL}/${id}`);
};

export const getVenues = async (): Promise<{ id: number; name: string }[]> => {
  const response = await api.get<{ message: string; data: { venue_id: number; venue_name: string }[] }>('/admin/venues/names'); // Adjust endpoint and response type
  return response.data.data.map(venue => ({ id: venue.venue_id, name: venue.venue_name })); // Map to desired format
};
