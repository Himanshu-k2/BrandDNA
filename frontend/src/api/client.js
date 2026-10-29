import axios from 'axios';

const rawBaseUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'https://branddna-tup9.onrender.com';

const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to attach JWT token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('branddna_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Let browser handle multipart/form-data boundary automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function normalizeIds(data) {
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
      localStorage.removeItem('branddna_token');
      localStorage.removeItem('branddna_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    
    // Standardize user-friendly message and prevent leaking server stack traces
    if (error.response?.data && typeof error.response.data === 'object') {
      if (!error.response.data.message && error.response.data.error) {
        error.response.data.message = error.response.data.error;
      }
    } else if (error.message === 'Network Error') {
      error.message = 'Unable to connect to BrandDNA server. Please check your network or ensure backend is running.';
    }
    return Promise.reject(error);
  }
);

export default client;
