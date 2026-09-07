/**
 * Normalizes the API base URL to ensure proper formatting across local and hosted environments.
 * Prevents:
 * 1. Double `/api/api/v1` if input has `/api`
 * 2. DNS failure `net::ERR_NAME_NOT_RESOLVED` if input is "api" without slash or domain without protocol
 * 3. Accidental quotes or bracket artifacts from copy-pasting into hosting dashboards
 */
export const getNormalizedApiUrl = () => {
  // If running in a browser on a hosted domain (not localhost/127.0.0.1),
  // always prioritize current origin for API calls to prevent ERR_CONNECTION_REFUSED
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      let envUrl = (import.meta.env.VITE_API_URL || '').replace(/[\[\]"']/g, '').trim();
      // If no env url or env url points to local machine, use current production origin
      if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
        return `${window.location.origin}/api/v1`;
      }
    }
  }

  let url = (import.meta.env.VITE_API_URL || '').replace(/[\[\]"']/g, '').trim();

  // If no env var provided, fallback to default local backend
  if (!url) {
    return 'http://127.0.0.1:5001/api/v1';
  }

  // Remove all trailing slashes
  url = url.replace(/\/+$/, '');

  // Handle bare relative path like "api" or "api/v1" without leading slash
  if (url === 'api' || url.startsWith('api/')) {
    url = `/${url}`;
  }

  // If it looks like an absolute domain without protocol (e.g. backend.onrender.com)
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    if (url.includes('.')) {
      url = `https://${url}`;
    } else {
      url = `/${url}`;
    }
  }

  // Guarantee /api/v1 suffix without duplication
  if (url.endsWith('/api/v1')) {
    return url;
  }
  if (url.endsWith('/api')) {
    return `${url}/v1`;
  }
  return `${url}/api/v1`;
};
