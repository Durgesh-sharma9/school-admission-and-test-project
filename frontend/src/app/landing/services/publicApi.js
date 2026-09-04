import axios from 'axios';

const getNormalizedApiUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api/v1';
  url = url.replace(/[\[\]"']/g, '').trim().replace(/\/+$/, '');
  if (!url.endsWith('/api/v1')) {
    url = `${url}/api/v1`;
  }
  return url;
};

const publicApi = axios.create({
  baseURL: getNormalizedApiUrl(),
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
