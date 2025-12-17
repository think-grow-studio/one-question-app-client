import axios from 'axios';

// TODO: Replace with actual API URL from environment config
const API_BASE_URL = 'https://api.example.com';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens (when implemented)
apiClient.interceptors.request.use(
  async (config) => {
    // TODO: Add token from secure storage when auth is implemented
    // const token = await authService.getAccessToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // TODO: Handle token refresh logic when auth is implemented
    if (error.response?.status === 401) {
      // Handle unauthorized
    }

    return Promise.reject(error);
  }
);
