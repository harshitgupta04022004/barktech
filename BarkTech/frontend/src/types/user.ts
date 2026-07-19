export type UserRole = 'super_admin' | 'admin' | 'sales' | 'support' | 'viewer';

export interface User {
  _id: string;
  email: string;
  name: string;
  fullName?: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
  googleId?: string;
  lastLogin?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}
