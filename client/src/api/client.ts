import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 15000,
});

// Request interceptor — no-op placeholder for future logging in dev
apiClient.interceptors.request.use((config) => config);

// Response interceptor — redirect to /login on 401 for protected app routes
apiClient.interceptors.response.use(
  (res) => res,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 401 && window.location.pathname.startsWith('/app')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
