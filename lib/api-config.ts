const API_BASE_URL =
  process.env.NEXT_PUBLIC_URBEX_API_URL || 'https://api-prod.urbex.com.co';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
};

export const API_ENDPOINTS = {
  HEALTH: '/health',
};
