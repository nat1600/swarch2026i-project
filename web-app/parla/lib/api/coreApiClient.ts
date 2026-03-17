// Core Service API Client Configuration
import axios, { AxiosInstance, AxiosError } from 'axios';

// Create axios instance with base configuration
const coreApiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_CORE_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token from cookie
coreApiClient.interceptors.request.use(
  async (config) => {
    // Get access token from Auth0 session cookie
    // The token is automatically sent via cookies by the browser
    // For client-side requests, we need to use the /api/auth/token endpoint
    try {
      if (typeof window !== 'undefined') {
        const tokenResponse = await fetch('/api/auth/token');
        if (tokenResponse.ok) {
          const { accessToken } = await tokenResponse.json();
          if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get access token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
coreApiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default coreApiClient;
