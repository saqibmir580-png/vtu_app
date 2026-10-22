import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Determine default API base URL dynamically
const getBaseUrl = () => {
  // 1. Check explicit environment variable first
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    // Strip any internal or accidental whitespace and trailing slashes
    const sanitized = envUrl.replace(/\s+/g, '').replace(/\/+$/, '');
    if (sanitized.startsWith('http://') || sanitized.startsWith('https://')) {
      return sanitized;
    }
  }

  // 2. Attempt dynamic resolution of developer machine IPv4 address from Expo Metro
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.developer;
  if (hostUri) {
    const rawHost = hostUri.split(':')[0];
    // Check if rawHost is a valid IPv4 address (e.g. 192.168.1.35)
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (rawHost && ipv4Regex.test(rawHost)) {
      return `http://${rawHost}:5000/api/v1`;
    }
  }

  // 3. Default fallback LAN IP for local backend
  return 'http://192.168.1.35:5000/api/v1';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log(`[API Client] Initialized Base URL: ${apiClient.defaults.baseURL}`);

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('vtu_mobile_access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore storage errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh Token Lock & Request Queue
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Unwrap Data & Auto-Refresh Token on 401
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Check if error is 401 Unauthorized and not already retried
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('vtu_mobile_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call NestJS refresh token endpoint using raw axios instance
        const res = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh`, {
          refreshToken,
        });

        // NestJS TransformInterceptor returns { statusCode, message, data: { accessToken, refreshToken } }
        const payload = res.data?.data || res.data;
        const newAccessToken = payload?.accessToken;
        const newRefreshToken = payload?.refreshToken;

        if (!newAccessToken) {
          throw new Error('Invalid refresh token response from server');
        }

        // Persist rotated tokens
        await AsyncStorage.setItem('vtu_mobile_access_token', newAccessToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem('vtu_mobile_refresh_token', newRefreshToken);
        }

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        // Clear stored tokens and session data on failed refresh
        await AsyncStorage.removeItem('vtu_mobile_access_token');
        await AsyncStorage.removeItem('vtu_mobile_refresh_token');
        await AsyncStorage.removeItem('vtu_mobile_user');
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Format Network & API Error Messages
    let errorMessage = 'Network error. Please check your connection and try again.';

    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data.message === 'string') {
        errorMessage = data.message;
      } else if (Array.isArray(data.message)) {
        errorMessage = data.message.join(', ');
      } else if (typeof data === 'string') {
        errorMessage = data;
      }
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      errorMessage = 'Connection timeout. The server took too long to respond.';
    } else if (error.message === 'Network Error' || !error.response) {
      errorMessage = `Cannot connect to server at ${apiClient.defaults.baseURL}. Please ensure the backend is running and your device is on the same network.`;
    }

    return Promise.reject(new Error(errorMessage));
  }
);

