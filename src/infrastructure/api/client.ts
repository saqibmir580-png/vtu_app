import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Explicit active Wi-Fi LAN IP (verified via ipconfig)
export const ACTIVE_LAN_IP = '192.168.1.58';
export const DEFAULT_API_URL = `http://${ACTIVE_LAN_IP}:5000/api/v1`;

// Determine default API base URL dynamically with strict environment isolation
export const getBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const appEnv =
    process.env.EXPO_PUBLIC_APP_ENV ||
    (process.env.NODE_ENV === 'production' ? 'production' : 'development');

  if (envUrl && envUrl.trim() !== '') {
    // Strip whitespace and trailing slashes
    const sanitized = envUrl.replace(/\s+/g, '').replace(/\/+$/, '');
    if (sanitized.startsWith('http://') || sanitized.startsWith('https://')) {
      return sanitized;
    }
  }

  // Enforce strict configuration in Production and Preview/Staging environments
  if (appEnv === 'production' || appEnv === 'preview') {
    throw new Error(
      `[FATAL CONFIG ERROR] EXPO_PUBLIC_API_URL is missing or invalid for '${appEnv}' environment. ` +
      `A valid HTTPS endpoint must be configured in EAS/Environment variables. Fallback logic is disabled in production.`
    );
  }

  // Test environment fallback to offset port 5001 if unset
  if (appEnv === 'test') {
    return 'http://localhost:5001/api/v1';
  }

  // Development only: Attempt dynamic resolution from Expo Metro bundler host
  // Exclude virtual WSL/Hyper-V (172.x.x.x) and loopback (127.0.0.1) addresses
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.developer;
  if (hostUri) {
    const rawHost = hostUri.split(':')[0];
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (
      rawHost &&
      ipv4Regex.test(rawHost) &&
      !rawHost.startsWith('172.') &&
      !rawHost.startsWith('127.')
    ) {
      return `http://${rawHost}:5000/api/v1`;
    }
  }

  // Default active Wi-Fi LAN IP from ipconfig
  return DEFAULT_API_URL;
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log(`[API Client] Initialized Base URL: ${apiClient.defaults.baseURL}`);

// Callback hook for notifying auth store when session expires or refresh fails
let authFailureHandler: (() => void) | null = null;
export const setAuthFailureHandler = (handler: () => void) => {
  authFailureHandler = handler;
};

// Request Interceptor: Attach Access Token (Never logs token) and format multipart
apiClient.interceptors.request.use(
  async (config) => {
    if (!config.baseURL) {
      config.baseURL = getBaseUrl();
    }
    try {
      const token = await AsyncStorage.getItem('vtu_mobile_access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Ignore storage errors
    }

    // Auto-detect FormData and remove explicit Content-Type so React Native / Axios
    // injects the multipart/form-data boundary parameter automatically
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
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
        if (authFailureHandler) {
          authFailureHandler();
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Format Network & API Error Messages (Sanitized, no tokens)
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
      errorMessage = `Cannot connect to server at ${apiClient.defaults.baseURL || getBaseUrl()}. Please ensure the backend is running and reachable.`;
    }

    return Promise.reject(new Error(errorMessage));
  }
);
