import axios from 'axios';
import type { TripRequest, TripOption } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export const optimizeTrip = async (request: TripRequest): Promise<any> => {
  const response = await axios.post(`${API_BASE}/api/optimize`, request);
  return response.data;
};

export const fetchEnvironment = async (lat: number, lon: number): Promise<any> => {
  const response = await axios.get(`${API_BASE}/api/environment?lat=${lat}&lon=${lon}`);
  return response.data;
};

export const acceptTrip = async (userId: string, originalTrip: TripOption, recommendation: TripOption, estimatedSavings: any): Promise<any> => {
  const response = await axios.post(`${API_BASE}/api/trip/accept`, {
    userId,
    originalTrip,
    recommendation,
    estimatedSavings
  });
  return response.data;
};

export const fetchDashboard = async (userId: string): Promise<any> => {
  const response = await axios.get(`${API_BASE}/api/dashboard?userId=${userId}`);
  return response.data;
};

export const fetchImpact = async (): Promise<any> => {
  const response = await axios.get(`${API_BASE}/api/impact`);
  return response.data;
};

export const geocodeLocation = async (query: string): Promise<{ lat: number, lon: number, display_name: string } | null> => {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`);
    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon),
        display_name: response.data[0].display_name
      };
    }
  } catch (err) {
    console.error("Geocoding failed", err);
  }
  return null;
};

export const fetchRoutines = async (userId: string): Promise<any> => {
  const response = await axios.get(`${API_BASE}/api/routine?userId=${userId}`);
  return response.data;
};

export const addRoutine = async (routine: any): Promise<any> => {
  const response = await axios.post(`${API_BASE}/api/routine`, routine);
  return response.data;
};

export const deleteRoutine = async (userId: string, tripId: string): Promise<any> => {
  const response = await axios.delete(`${API_BASE}/api/routine?userId=${userId}&tripId=${tripId}`);
  return response.data;
};
