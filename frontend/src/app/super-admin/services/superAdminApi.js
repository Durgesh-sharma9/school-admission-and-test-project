import axios from 'axios';

const getNormalizedApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1';
  url = url.replace(/[\[\]"']/g, '').trim().replace(/\/+$/, '');
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }
  return url;
};

const apiBase = getNormalizedApiUrl();

const superAdminApi = axios.create({
  baseURL: apiBase.endsWith('/super-admin') ? apiBase : `${apiBase}/super-admin`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
superAdminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('superAdminToken') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
superAdminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Super Admin API returned 401 Unauthorized');
    }
    return Promise.reject(error);
  }
);

export default superAdminApi;
