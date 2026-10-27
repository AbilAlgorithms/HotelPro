import axios from 'axios';

export const TOKEN_KEY = 'roomly_token';
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

const api = axios.create({ baseURL, timeout: 15000 });

// Turn a stored image path (/uploads/...) into a full URL served by the API.
export const assetUrl = (p) => (!p ? '' : /^https?:/.test(p) ? p : baseURL.replace(/\/api\/?$/, '') + p);

// Attach the Bearer token to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Central 401 handling: drop the session and tell AuthContext (login/register failures are excluded).
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !/\/auth\/(login|register)/.test(url)) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('roomly:unauthorized'));
    }
    return Promise.reject(err);
  }
);

// Human-friendly message from any Axios error (never includes tokens).
export const errMsg = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.message || (err?.request ? 'Cannot reach the Roomly server. Check that the API is running.' : fallback);

export default api;
