import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// URL da API - ajuste conforme necessário
const API_URL = __DEV__
  ? 'https://d27w10rtb3dij9.cloudfront.net' // Desenvolvimento local - IP da máquina na rede
  : 'https://d27w10rtb3dij9.cloudfront.net'; // Produção

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
    console.log(`[API] Fazendo requisição para: ${config.baseURL}${config.url}`);
    const token = await SecureStore.getItemAsync('user-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Token adicionado à requisição');
    }
    return config;
  },
  (error) => {
    console.error('[API] Erro no interceptor de request:', error);
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Resposta recebida: ${response.status} - ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error('[API] Erro na resposta:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      // Token inválido, limpar storage
      console.log('[API] Token inválido (401), limpando storage');
      await SecureStore.deleteItemAsync('user-token');
    }
    return Promise.reject(error);
  }
);

export default api;
