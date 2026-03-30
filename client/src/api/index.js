import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    accept: 'application/json',
  },
});

export const api = {
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
};
