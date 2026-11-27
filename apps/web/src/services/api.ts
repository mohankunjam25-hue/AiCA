import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/v1`
  : '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and request can be silently refreshed
    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/google');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshRes.data.data.accessToken;
        useAuthStore.getState().setAccessToken(newAccessToken);

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Approach 1: Centralized Network Error Normalizer
    // Catches network drops, offline states, timeouts, and server unreachable events
    if (!error.response || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      const isOffline =
        typeof window !== 'undefined' &&
        typeof window.navigator !== 'undefined' &&
        !window.navigator.onLine;
      const isTimeout = error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout');

      let networkErrorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      let networkErrorCode = 'NETWORK_ERROR';

      if (isOffline) {
        networkErrorMessage = 'You are currently offline. Please check your internet connection and try again.';
        networkErrorCode = 'OFFLINE';
      } else if (isTimeout) {
        networkErrorMessage = 'Connection timed out. The server took too long to respond. Please try again.';
        networkErrorCode = 'TIMEOUT';
      }

      error.isNetworkError = true;
      error.networkMessage = networkErrorMessage;

      // Polyfill error.response so all standard Axios catch blocks receive the meaningful English message
      error.response = {
        status: 0,
        statusText: 'Network Error',
        headers: {},
        config: originalRequest || error.config,
        data: {
          success: false,
          error: {
            code: networkErrorCode,
            message: networkErrorMessage
          }
        }
      };
    }

    return Promise.reject(error);
  }
);
