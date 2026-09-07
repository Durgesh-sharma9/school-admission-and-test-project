import axios from 'axios';
import { getNormalizedApiUrl } from '../../../shared/utils/apiUrl';

// Default School API client configuration
const schoolApi = axios.create({
  baseURL: getNormalizedApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-inject JWT token from localStorage
schoolApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Global response interceptor to format errors
schoolApi.interceptors.response.use(
  (response) => {
    // Check if server returned an HTML fallback page instead of JSON
    if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
      const htmlError = new Error('API URL misconfigured (received HTML instead of JSON). Check VITE_API_URL in Render.');
      htmlError.status = 502;
      return Promise.reject(htmlError);
    }
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong with the connection';
    
    // Create custom error object to handle consistently on frontend
    const apiError = new Error(message);
    apiError.status = error.response?.status;
    apiError.data = error.response?.data;
    
    return Promise.reject(apiError);
  }
);

export default schoolApi;
export { axios };
