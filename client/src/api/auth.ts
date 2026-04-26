import type { SignupInput, LoginInput } from '../schemas/auth.schema';
import type { ApiResponse, User } from '../types/api';
import { apiClient } from './client';

type AuthResponse = ApiResponse<{ user: User }>;
type MeResponse = ApiResponse<{ user: User | null }>;

export const authApi = {
  signup: async (input: SignupInput): Promise<User> => {
    const res = await apiClient.post<AuthResponse>('/auth/signup', input);
    const user = res.data.data?.user;
    if (!user) throw new Error('Unexpected response from signup');
    return user;
  },

  login: async (input: LoginInput): Promise<User> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', input);
    const user = res.data.data?.user;
    if (!user) throw new Error('Unexpected response from login');
    return user;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  me: async (): Promise<User | null> => {
    const res = await apiClient.get<MeResponse>('/auth/me');
    return res.data.data?.user ?? null;
  },
};
