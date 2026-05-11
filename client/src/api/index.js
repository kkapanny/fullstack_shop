import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    accept: 'application/json',
  },
});

function getAccessToken() {
  return localStorage.getItem('accessToken');
}

function getRefreshToken() {
  return localStorage.getItem('refreshToken');
}

function setTokens(accessToken, refreshToken) {
  if (accessToken) {
    localStorage.setItem('accessToken', accessToken);
  }
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  } else {
    localStorage.removeItem('refreshToken');
  }
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        return Promise.reject(error);
      }
      try {
        const refreshResponse = await axios.post(
          'http://localhost:3000/api/auth/refresh',
          {},
          { headers: { 'x-refresh-token': refreshToken } },
        );
        const newAccessToken = refreshResponse.data?.accessToken;
        const newRefreshToken = refreshResponse.data?.refreshToken;
        if (!newAccessToken || !newRefreshToken) {
          clearTokens();
          return Promise.reject(error);
        }
        setTokens(newAccessToken, newRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearTokens();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export const api = {
  clearTokens,
  getAccessToken,
  async register(payload) {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
  },
  async login(payload) {
    const response = await apiClient.post('/auth/login', payload);
    if (response.data?.accessToken) {
      setTokens(response.data.accessToken, response.data?.refreshToken);
    }
    return response.data;
  },
  async me() {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
  async refresh() {
    const refreshToken = getRefreshToken();
    const response = await apiClient.post('/auth/refresh', {}, { headers: { 'x-refresh-token': refreshToken } });
    if (response.data?.accessToken && response.data?.refreshToken) {
      setTokens(response.data.accessToken, response.data.refreshToken);
    }
    return response.data;
  },
  async getProducts() {
    const response = await apiClient.get('/products');
    return response.data;
  },
  async getProductById(id) {
    const response = await apiClient.get(`/products/${id}`);
    return response.data?.data ?? null;
  },
  async createProduct(payload) {
    const response = await apiClient.post('/products', payload);
    return response.data;
  },
  async updateProduct(id, payload) {
    const response = await apiClient.patch(`/products/${id}`, payload);
    return response.data;
  },
  async deleteProduct(id) {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },
  async getUsers() {
    const response = await apiClient.get('/users');
    return response.data;
  },
  async updateUser(id, payload) {
    const response = await apiClient.put(`/users/${id}`, payload);
    return response.data;
  },
  async blockUser(id) {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
  async removeUser(id) {
    const response = await apiClient.delete(`/users/${id}/permanent`);
    return response.data;
  },
};
