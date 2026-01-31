import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests if available
// Add auth token to requests if available
api.interceptors.request.use(async (config) => {
    // Try to get token from Clerk (if available globally)
    try {
        const token = await window.Clerk?.session?.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.error("Error fetching Clerk token", error);
    }
    return config;
});

export default api;
