// Gamification Service API Client
import axios, { AxiosInstance, AxiosError } from 'axios';

const baseURL = typeof window === 'undefined'
  ? process.env.SERVER_GAMIFICATION_URL || process.env.NEXT_PUBLIC_GAMIFICATION_API_URL || 'http://localhost:8080/api/game'
  : process.env.NEXT_PUBLIC_GAMIFICATION_API_URL || 'http://localhost:8080/api/game';

const gamificationApiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject Auth0 access token on every request
gamificationApiClient.interceptors.request.use(
  async (config) => {
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
      console.warn('Failed to get access token for gamification client:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

gamificationApiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      console.error('Gamification API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('Gamification Network Error:', error.message);
    } else {
      console.error('Gamification Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default gamificationApiClient;
