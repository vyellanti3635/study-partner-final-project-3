import type { ApiResponse, Subject } from '../types/api';
import { apiClient } from './client';

type SubjectsResponse = ApiResponse<Subject[]>;
type SubjectResponse = ApiResponse<Subject>;

export const subjectsApi = {
  list: async (): Promise<Subject[]> => {
    const res = await apiClient.get<SubjectsResponse>('/subjects');
    return res.data.data ?? [];
  },

  create: async (name: string): Promise<{ subject: Subject; isExisting: boolean }> => {
    try {
      const res = await apiClient.post<SubjectResponse>('/subjects', { name });
      return { subject: res.data.data!, isExisting: false };
    } catch (error: unknown) {
      // 409 means the subject already exists — per Req 8.3 return the existing one
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 409
      ) {
        const axiosError = error as { response: { data: SubjectResponse } };
        const existing = axiosError.response.data.data;
        if (existing) return { subject: existing, isExisting: true };
      }
      throw error;
    }
  },
};
