// src/api/axiosClient.js
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api', // Default to localhost, use VITE_BACKEND_URL for deployment
  headers: {
    'Content-Type': 'application/json',
  },
});

// Optional: Add an interceptor to include JWT token in requests
axiosClient.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('userInfo')); // Assuming you store user info with token here
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosClient;