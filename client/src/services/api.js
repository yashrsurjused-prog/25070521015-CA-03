import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartcampus_token');

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      localStorage.removeItem('smartcampus_token');
      localStorage.removeItem('smartcampus_user');

      if (
        currentPath !== '/login' &&
        currentPath !== '/register' &&
        currentPath !== '/'
      ) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error, fallback = 'Something went wrong.') {
  if (error?.response?.data?.errors?.length) {
    return error.response.data.errors[0];
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (!error?.response) {
    return 'Unable to connect to the campus service. Please check your connection and try again.';
  }

  return error?.message || fallback;
}

export async function checkHealth() {
  const response = await api.get('/api/health');
  return response.data;
}

export { API_BASE_URL, api };
export default api;
