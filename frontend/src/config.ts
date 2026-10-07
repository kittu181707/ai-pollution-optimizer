export const PRODUCT_NAME = import.meta.env.VITE_PRODUCT_NAME?.trim() || 'AI Personal Pollution Optimizer';
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const AWS_REGION = import.meta.env.VITE_AWS_REGION?.trim() || '';
export const AMAZON_LOCATION_API_KEY = import.meta.env.VITE_AMAZON_LOCATION_API_KEY?.trim() || '';
export const AMAZON_LOCATION_MAP_STYLE = import.meta.env.VITE_AMAZON_LOCATION_MAP_STYLE?.trim() || 'Standard';
