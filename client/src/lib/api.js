import axios from 'axios';
import { auth } from '../firebase';

// All calls to the Express server go through this instance.
// It auto-attaches the Firebase ID token so the server can verify the user.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
