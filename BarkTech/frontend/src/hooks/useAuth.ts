import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth';
import type { LoginRequest, RegisterRequest } from '@/types/user';

export function useAuth() {
  const { user, token, isAuthenticated, login, logout, setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = useCallback(
    async (data: LoginRequest) => {
      const response = await authApi.login(data);
      if (response.success && response.data) {
        login(response.data.user, response.data.token);
        navigate('/admin');
      }
      return response;
    },
    [login, navigate]
  );

  const handleRegister = useCallback(
    async (data: RegisterRequest) => {
      const response = await authApi.register(data);
      if (response.success && response.data) {
        login(response.data.user, response.data.token);
        navigate('/admin');
      }
      return response;
    },
    [login, navigate]
  );

  const handleLogout = useCallback(() => {
    logout();
    navigate('/admin/login');
  }, [logout, navigate]);

  const fetchProfile = useCallback(async () => {
    if (!isAuthenticated) return;
    const response = await authApi.getProfile();
    if (response.success && response.data) {
      setUser(response.data);
    } else {
      logout();
    }
  }, [isAuthenticated, setUser, logout]);

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchProfile();
    }
  }, [isAuthenticated, user, fetchProfile]);

  return {
    user,
    token,
    isAuthenticated,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
    fetchProfile,
  };
}
