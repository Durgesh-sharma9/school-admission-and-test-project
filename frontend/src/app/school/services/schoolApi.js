import axios from 'axios';

const getNormalizedApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api/v1';
  url = url.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }
  return url;
};

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

export default schoolApi;
export { axios };
