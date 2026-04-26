import axios from 'axios';

// Create an Axios instance for API calls
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for secure HTTP-only cookies
});

// Add a response interceptor to handle unauthenticated conditions
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      const publicPaths = ['/', '/login', '/signup'];
      const authMeRequest = error.config && error.config.url && error.config.url.endsWith('/auth/me');

      // Only redirect to login for protected requests, not during welcome page auth checks
      if (!publicPaths.includes(window.location.pathname) && !authMeRequest) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
