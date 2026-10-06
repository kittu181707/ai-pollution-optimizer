export const PRODUCT_NAME = import.meta.env.VITE_PRODUCT_NAME?.trim() || 'PROJECT_NAME';
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
