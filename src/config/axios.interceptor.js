/**
 * Axios Interceptor - Handles token refresh and authentication
 * @module config/axios.interceptor
 */

import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Create and configure axios instance
 */
export function setupAxios() {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Include cookies
  });

  // Request interceptor - add auth token
  instance.interceptors.request.use(
    (config) => {
      const authStore = useAuthStore();
      if (authStore.accessToken) {
        config.headers.Authorization = `Bearer ${authStore.accessToken}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle 401 and refresh
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const authStore = useAuthStore();
      const originalRequest = error.config;

      // Check if 401 and not already retried
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh token
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, {
            withCredentials: true,
          });

          if (response.data.success) {
            // Update token in store
            authStore.setAccessToken(response.data.accessToken);

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
            return instance(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed: do NOT reset client auth state here. Resetting can cause abrupt UX
          // disruptions (immediate logout) during volatile flows (veto/draft). Instead, log the
          // failure and propagate the error so the app can decide how/when to clear state or
          // navigate to login.
          console.warn('Token refresh failed during interceptor; preserving client auth state for now.', refreshError?.message || refreshError);
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
}

// Lazily create axios instance on first access so tests can mock `axios` before
// the instance is created. We export a proxy object that forwards calls to the
// real axios instance once it's initialized.
let _instance = null;
function _ensureInstance() {
  if (!_instance) _instance = setupAxios();
  return _instance;
}

const apiProxy = new Proxy({}, {
  get(target, prop) {
    const inst = _ensureInstance();
    const value = inst[prop];
    // If the property is a function, bind it to the instance
    if (typeof value === 'function') return value.bind(inst);
    return value;
  }
});

export default apiProxy;
