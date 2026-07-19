import { apiClient } from './client';
import type { ApiResponse } from '@/types/api';
import type {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
} from '@/types/user';

export const authApi = {
  login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>('/auth/login', data);
  },

  register(data: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>('/auth/register', data);
  },

  googleSignIn(credential: string): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>('/auth/google/token', { credential });
  },

  getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/auth/profile');
  },

  updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<User>> {
    return apiClient.put<User>('/auth/profile', data);
  },

  changePassword(data: ChangePasswordRequest): Promise<ApiResponse<null>> {
    return apiClient.put<null>('/auth/change-password', data);
  },

  forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse<null>> {
    return apiClient.post<null>('/auth/forgot-password', data);
  },
};
