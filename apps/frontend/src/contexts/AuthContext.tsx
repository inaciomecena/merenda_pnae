import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import type { ApiResponse, AuthResponse, AuthUser, UserContext } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  context: UserContext | null;
  refreshContext: () => Promise<void>;
  selectedVinculo: string;
  selectVinculo: (id: string) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [context, setContext] = useState<UserContext | null>(null);
  const [selectedVinculo, setSelectedVinculo] = useState(() => sessionStorage.getItem('seaf_vinculo') || '');
  const selectVinculo = useCallback((id: string) => {
    if (id) sessionStorage.setItem('seaf_vinculo', id); else sessionStorage.removeItem('seaf_vinculo');
    setSelectedVinculo(id);
  }, []);
  const refreshContext = useCallback(async () => {
    const { data } = await api.get<ApiResponse<UserContext>>('/auth/me/contexto');
    setContext(data.data);
    const selected = sessionStorage.getItem('seaf_vinculo');
    if (selected && !data.data.vinculos.some(v => v.id === selected)) selectVinculo('');
  }, [selectVinculo]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('seaf_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get<ApiResponse<AuthUser>>('/auth/me')
      .then(async ({ data }) => { setUser(data.data); await refreshContext(); })
      .catch((error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('seaf_token');
          localStorage.removeItem('seaf_refresh');
        }
      })
      .finally(() => setLoading(false));
  }, [refreshContext]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
      localStorage.setItem('seaf_token', data.data.accessToken);
      localStorage.setItem('seaf_refresh', data.data.refreshToken);
      setUser(data.data.user);
      selectVinculo('');
      await refreshContext();
    } finally {
      setLoading(false);
    }
  }, [refreshContext, selectVinculo]);

  const logout = useCallback(() => {
    localStorage.removeItem('seaf_token');
    localStorage.removeItem('seaf_refresh');
    setUser(null);
    setContext(null);
    selectVinculo('');
  }, [selectVinculo]);

  const value = useMemo(
    () => ({ user, context, refreshContext, selectedVinculo, selectVinculo, login, logout, isAuthenticated: Boolean(user), loading }),
    [user, context, refreshContext, selectedVinculo, selectVinculo, login, logout, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
