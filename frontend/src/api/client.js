import axios from 'axios';

// VITE_API_URL is unset for the normal web build, where the frontend is served
// by the same Express origin as the API (relative '/api' and same-origin sockets
// both just work). It's set only for the Capacitor build, whose WebView runs on
// a capacitor://localhost origin with no same-origin API to call.
const API_URL = import.meta.env.VITE_API_URL || '';

export const apiClient = axios.create({ baseURL: `${API_URL}/api` });

export const SOCKET_URL = import.meta.env.DEV ? 'http://localhost:5000' : (API_URL || undefined);

// Uploaded-file URLs from the API are host-relative ('/uploads/...'). That's fine
// when the frontend is served from the same origin as the API, but the Capacitor
// build has no same origin to resolve against, so it needs the API host prefixed.
export function mediaUrl(path) {
  if (!path || /^https?:\/\//i.test(path)) return path;
  return `${API_URL}${path}`;
}

export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  return err?.response?.data?.error || fallback;
}
