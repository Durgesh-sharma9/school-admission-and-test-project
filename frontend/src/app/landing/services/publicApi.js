import axios from 'axios';

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Handle response errors
publicApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default publicApi;
