import axios from 'axios';

const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl) return envUrl.replace(/\/+$/, '');
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5001';
  }
  return 'https://branddna-1-wndy.onrender.com';
};

const client = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to attach JWT token
client.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('branddna_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function normalizeIds(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(normalizeIds);
  }
  const copy = { ...data };
  if (copy.id && !copy._id) {
    copy._id = copy.id;
  } else if (copy._id && !copy.id) {
    copy.id = copy._id;
  }
  for (const key of Object.keys(copy)) {
    if (copy[key] && typeof copy[key] === 'object') {
      copy[key] = normalizeIds(copy[key]);
    }
  }
  return copy;
}

// Response interceptor to handle errors and normalize IDs
client.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object') {
      response.data = normalizeIds(response.data);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('branddna_token');
        localStorage.removeItem('branddna_user');
      }
    }
    if (error.response?.data && typeof error.response.data === 'object') {
      if (!error.response.data.message && error.response.data.error) {
        error.response.data.message = error.response.data.error;
      }
    } else if (error.message === 'Network Error') {
      error.message = 'Unable to connect to BrandDNA server. Operating in resilient offline mode.';
    }
    return Promise.reject(error);
  }
);

export default client;
