import axios from 'axios';
import { getNormalizedApiUrl } from '../../../shared/utils/apiUrl';

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
