import axios from 'axios';

// Default API client configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-inject JWT token from localStorage
api.interceptors.request.use(
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
api.interceptors.response.use(
  (response) => response.data,
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

export default api;
export { axios };
