import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { STORAGE_KEYS } from '@/lib/constants';
import type { User } from '@/types/user';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const userJson = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      navigate(`/admin/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
        login(user, token);

        const role = user.role;
        if (role === 'super_admin' || role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } catch {
        navigate('/admin/login?error=invalid_callback_data');
      }
    } else {
      navigate('/admin/login?error=missing_token');
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Signing you in with Google...</p>
      </div>
    </div>
  );
}
