import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('busyatra_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect here — let AuthContext.verifyToken() failure handle logout
      // Using window.location.href breaks SPA routing
      const isVerifyCall = error.config?.url?.includes('/auth/verify');
      if (!isVerifyCall) {
        localStorage.removeItem('busyatra_token');
        localStorage.removeItem('busyatra_user');
        // Dispatch a custom event so App.js can handle logout cleanly
        window.dispatchEvent(new Event('busyatra_unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  verifyToken: () => api.get('/auth/verify'),
};

// Bus API
export const busAPI = {
  getAllBuses: (params) => api.get('/buses', { params }),
  getBusById: (id) => api.get(`/buses/${id}`),
  getBusLocation: (id) => api.get(`/buses/${id}/location`),
  trackBus: (id) => api.get(`/buses/${id}/track`),
  getNearbyBuses: (lat, lng, maxDistance) => 
    api.get('/buses/nearby', { params: { latitude: lat, longitude: lng, maxDistance } }),
};

// Route API
export const routeAPI = {
  getAllRoutes: (params) => api.get('/routes', { params }),
  getRouteById: (id) => api.get(`/routes/${id}`),
  getRouteLive: (id) => api.get(`/routes/${id}/live`),
  searchRoutes: (params) => api.get('/routes/search', { params }),
  calculateFare: (routeId, data) => api.post(`/routes/${routeId}/calculate-fare`, data),
};

// Trip API
export const tripAPI = {
  createTrip: (tripData) => api.post('/trips', tripData),
  getUserTrips: (params) => api.get('/trips/user', { params }),
  getTripById: (id) => api.get(`/trips/${id}`),
  updateTripStatus: (id, status) => api.put(`/trips/${id}/status`, { status }),
  cancelTrip: (id) => api.delete(`/trips/${id}`),
};

// Notification API
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (userData) => api.put('/user/profile', userData),
  changePassword: (passwordData) => api.put('/user/password', passwordData),
  addFavoriteRoute: (routeId) => api.post(`/user/favorites/${routeId}`),
  removeFavoriteRoute: (routeId) => api.delete(`/user/favorites/${routeId}`),
};

export default api;
