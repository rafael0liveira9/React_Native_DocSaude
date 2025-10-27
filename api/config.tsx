import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// URL da API - ajuste conforme necessário
const API_URL = __DEV__
  ? 'http://172.16.10.9:3000/dev' // Desenvolvimento local - IP da máquina na rede
  : 'https://your-api-gateway-url.amazonaws.com/dev'; // Produção

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('user-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token inválido, limpar storage
      await SecureStore.deleteItemAsync('user-token');
    }
    return Promise.reject(error);
  }
);

export default api;
