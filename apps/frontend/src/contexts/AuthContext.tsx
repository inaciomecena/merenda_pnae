import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import type { ApiResponse, AuthResponse, AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sagae_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get<ApiResponse<AuthUser>>('/auth/me')
      .then(({ data }) => setUser(data.data))
      .catch(() => {
        localStorage.removeItem('sagae_token');
        localStorage.removeItem('sagae_refresh');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
      localStorage.setItem('sagae_token', data.data.accessToken);
      localStorage.setItem('sagae_refresh', data.data.refreshToken);
      setUser(data.data.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sagae_token');
    localStorage.removeItem('sagae_refresh');
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, isAuthenticated: Boolean(user), loading }),
    [user, login, logout, loading],
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
