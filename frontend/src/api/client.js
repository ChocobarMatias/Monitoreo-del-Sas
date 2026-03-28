import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const refreshToken = localStorage.getItem('refresh_token');

    if (error.response?.status === 401 && refreshToken && !original._retried) {
      original._retried = true;
      const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
      localStorage.setItem('access_token', data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(original);
    }

    return Promise.reject(error);
  }
);
