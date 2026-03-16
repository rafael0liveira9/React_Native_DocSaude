import * as SecureStore from 'expo-secure-store';

// URL da API
const API_URL = 'https://vpaa97q6g8.execute-api.us-east-1.amazonaws.com/dev';

/**
 * Cliente HTTP baseado em fetch nativo.
 * Substitui o axios que causa ERR_NETWORK em builds iOS nativas (TestFlight).
 * Mantém a mesma interface (api.get, api.post, api.put, api.delete, etc.)
 */

async function request(
  method: string,
  url: string,
  data?: any,
  config?: { headers?: Record<string, string>; timeout?: number; responseType?: string }
) {
  const fullUrl = `${API_URL}${url}`;
  const token = await SecureStore.getItemAsync('user-token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config?.headers,
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  console.log(`[API] ${method} ${url}`);

  const controller = new AbortController();
  const timeoutMs = config?.timeout || 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Suporte a FormData (upload de imagens)
    let body: any = undefined;
    if (data !== undefined && data !== null) {
      if (data instanceof FormData) {
        body = data;
        delete headers['Content-Type']; // Deixar o browser setar o boundary
      } else {
        body = JSON.stringify(data);
      }
    }

    const response = await fetch(fullUrl, {
      method,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Tratar 401
    if (response.status === 401) {
      console.log('[API] Token inválido (401), limpando storage');
      await SecureStore.deleteItemAsync('user-token');
    }

    // Parsear resposta
    let responseData: any;
    const contentType = response.headers.get('content-type');

    if (config?.responseType === 'blob') {
      responseData = await response.blob();
    } else if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    console.log(`[API] ${response.status} ${url}`);

    if (!response.ok) {
      const error: any = new Error(responseData?.message || `Request failed with status ${response.status}`);
      error.response = { status: response.status, data: responseData };
      error.config = { url };
      throw error;
    }

    return { data: responseData, status: response.status };
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      const timeoutError: any = new Error('Request timeout');
      timeoutError.code = 'TIMEOUT';
      timeoutError.config = { url };
      throw timeoutError;
    }

    if (!error.response) {
      console.error('[API] Erro de rede:', { url, message: error.message });
    }
    throw error;
  }
}

const api = {
  get: (url: string, config?: { headers?: Record<string, string>; params?: Record<string, any>; timeout?: number; responseType?: string }) => {
    // Montar query string a partir de params
    let finalUrl = url;
    if (config?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const qs = searchParams.toString();
      if (qs) finalUrl += `?${qs}`;
    }
    return request('GET', finalUrl, undefined, config);
  },

  post: (url: string, data?: any, config?: { headers?: Record<string, string>; timeout?: number }) =>
    request('POST', url, data, config),

  put: (url: string, data?: any, config?: { headers?: Record<string, string>; timeout?: number }) =>
    request('PUT', url, data, config),

  patch: (url: string, data?: any, config?: { headers?: Record<string, string>; timeout?: number }) =>
    request('PATCH', url, data, config),

  delete: (url: string, config?: { headers?: Record<string, string>; timeout?: number }) =>
    request('DELETE', url, undefined, config),
};

export default api;
