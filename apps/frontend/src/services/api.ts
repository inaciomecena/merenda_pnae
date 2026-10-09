import axios, { type InternalAxiosRequestConfig } from 'axios';

const api = axios.create({
  baseURL: (import.meta as ImportMeta & { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('seaf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let renovacao: Promise<string> | null = null;

api.interceptors.response.use(response => response, async error => {
  const request = error.config as (InternalAxiosRequestConfig & { sessaoRenovada?: boolean }) | undefined;
  const autenticacao = /\/auth\/(login|refresh)(?:[/?]|$)/.test(request?.url || '');
  if (error.response?.status !== 401 || !request || request.sessaoRenovada || autenticacao) {
    return Promise.reject(error);
  }

  request.sessaoRenovada = true;
  const atual = localStorage.getItem('seaf_token');
  // Outra requisição pode já ter renovado a sessão enquanto esta estava em andamento.
  if (atual && request.headers.Authorization !== `Bearer ${atual}`) {
    request.headers.Authorization = `Bearer ${atual}`;
    return api.request(request);
  }
  const refreshToken = localStorage.getItem('seaf_refresh');
  if (!refreshToken) return Promise.reject(error);

  try {
    if (!renovacao) {
      renovacao = api.post('/auth/refresh', { refreshToken }).then(response => {
        const token = response.data.data.accessToken as string;
        localStorage.setItem('seaf_token', token);
        return token;
      }).finally(() => { renovacao = null; });
    }
    const token = await renovacao;
    request.headers.Authorization = `Bearer ${token}`;
    return api.request(request);
  } catch (refreshError: any) {
    // Falhas temporárias de conexão não invalidam a sessão salva.
    if (refreshError.response?.status === 401) {
      localStorage.removeItem('seaf_token');
      localStorage.removeItem('seaf_refresh');
    }
    return Promise.reject(refreshError);
  }
});

export default api;
