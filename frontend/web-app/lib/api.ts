import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        error.message = 'Request timeout. Please check your connection.';
      } else if (error.message === 'Network Error') {
        error.message = 'Network error. Please check your internet connection.';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (data: any) => api.put('/auth/password', data),
};

// User APIs
export const userApi = {
  getAll: () => api.get('/users'),
  getOne: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Product APIs
export const productApi = {
  getAll: (params?: any) => api.get('/products', { params }),
  getOne: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Order APIs
export const orderApi = {
  getAll: () => api.get('/orders'),
  getAllAdmin: () => api.get('/orders/admin/all'),
  getOne: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  updateStatus: (id: string, status: string) =>
    api.put(`/orders/${id}/status`, { status }),
  updatePayment: (id: string, paymentId: string, paymentStatus: string) =>
    api.put(`/orders/${id}/payment`, { paymentId, paymentStatus }),
  delete: (id: string) => api.delete(`/orders/${id}`),
};

// Payment APIs
export const paymentApi = {
  process: (data: any) => api.post('/payments/process', data),
  getStatus: (orderId: string) => api.get(`/payments/${orderId}`),
  refund: (data: any) => api.post('/payments/refund', data),
};

// Upload APIs
export const uploadApi = {
  uploadImages: (files: FileList) => {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('images', file);
    });
    return api.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Category APIs
export const categoryApi = {
  getAll: () => api.get('/categories'),
  getOne: (id: string) => api.get(`/categories/${id}`),
  getBySlug: (slug: string) => api.get(`/categories/slug/${slug}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Management APIs
export const managementApi = {
  // Slider APIs
  getActiveSliders: () => api.get('/management/sliders'),
  getAllSliders: () => api.get('/management/sliders/all'),
  getSlider: (id: string) => api.get(`/management/sliders/${id}`),
  createSlider: (data: any) => api.post('/management/sliders', data),
  updateSlider: (id: string, data: any) => api.put(`/management/sliders/${id}`, data),
  deleteSlider: (id: string) => api.delete(`/management/sliders/${id}`),
  reorderSlider: (id: string, order: number) => api.put(`/management/sliders/${id}/reorder`, { order }),

  // Section APIs
  getActiveSections: () => api.get('/management/sections'),
  getAllSections: () => api.get('/management/sections/all'),
  getSection: (id: string) => api.get(`/management/sections/${id}`),
  createSection: (data: any) => api.post('/management/sections', data),
  updateSection: (id: string, data: any) => api.put(`/management/sections/${id}`, data),
  deleteSection: (id: string) => api.delete(`/management/sections/${id}`),
  reorderSection: (id: string, order: number) => api.put(`/management/sections/${id}/reorder`, { order }),
};

export default api;


