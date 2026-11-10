import axios from 'axios';
import { handleMockRequest } from './browserDb';

export const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('scholaris_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatic Browser DB Fallback for Vercel Standalone Showcase:
// If backend server is unreachable or not configured, all CRUD operations
// run directly in localStorage with zero external cloud database dependencies.
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const isOfflineOrUnreachable =
      !API_BASE_URL ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.response?.status === 404 ||
      error.response?.status === 502 ||
      error.response?.status === 503;

    if (config && isOfflineOrUnreachable) {
      try {
        const mockRes = await handleMockRequest(
          config.method || 'get',
          config.url || '',
          config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : undefined
        );
        return {
          data: mockRes.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      } catch (mockErr) {
        return Promise.reject(mockErr);
      }
    }
    return Promise.reject(error);
  }
);
