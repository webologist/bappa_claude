import axios from 'axios';

export const apiClient = axios.create({ baseURL: '/api' });

export const SOCKET_URL = import.meta.env.DEV ? 'http://localhost:5000' : undefined;

export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  return err?.response?.data?.error || fallback;
}
