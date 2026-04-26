import type { ProfileUpdateInput, PasswordChangeInput } from '../schemas/user.schema';
import type { ApiResponse, User } from '../types/api';
import { apiClient } from './client';

type UserResponse = ApiResponse<User>;

export const userApi = {
  updateProfile: async (input: ProfileUpdateInput): Promise<User> => {
    const res = await apiClient.patch<UserResponse>('/user/profile', input);
    const user = res.data.data;
    if (!user) throw new Error('Unexpected response from updateProfile');
    return user;
  },

  changePassword: async (input: PasswordChangeInput): Promise<void> => {
    await apiClient.patch('/user/password', input);
  },
};
