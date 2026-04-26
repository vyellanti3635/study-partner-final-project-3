import type { TaskCreateInput } from '../schemas/task.schema';
import type { ApiResponse, Task } from '../types/api';
import { apiClient } from './client';

type TasksListResponse = ApiResponse<Task[]>;
type TaskResponse = ApiResponse<Task>;

export type TasksQuery = {
  page?: number;
  limit?: number;
  subjectId?: string;
  q?: string;
  sort?: string;
  status?: string;
};

export type TaskStats = {
  total: number;
  dueToday: number;
  completed: number;
  subjects: number;
  weeklyProgress: Array<{
    subjectId: string;
    name: string;
    percent: number;
  }>;
};

export const tasksApi = {
  list: async (query: TasksQuery = {}) => {
    const res = await apiClient.get<TasksListResponse>('/tasks', { params: query });
    return res.data;
  },

  today: async (): Promise<Task[]> => {
    const res = await apiClient.get<TasksListResponse>('/tasks/today');
    return res.data.data ?? [];
  },

  upcoming: async (limit = 5): Promise<Task[]> => {
    const res = await apiClient.get<TasksListResponse>('/tasks/upcoming', { params: { limit } });
    return res.data.data ?? [];
  },

  stats: async (): Promise<TaskStats> => {
    const res = await apiClient.get<ApiResponse<TaskStats>>('/tasks/stats');
    const data = res.data.data;
    if (!data) throw new Error('No stats data returned');
    return data;
  },

  getById: async (id: string): Promise<Task> => {
    const res = await apiClient.get<TaskResponse>(`/tasks/${id}`);
    const task = res.data.data;
    if (!task) throw new Error('Task not found');
    return task;
  },

  create: async (input: TaskCreateInput): Promise<Task> => {
    const res = await apiClient.post<TaskResponse>('/tasks', input);
    const task = res.data.data;
    if (!task) throw new Error('Unexpected response from create task');
    return task;
  },

  update: async (id: string, input: Partial<TaskCreateInput>): Promise<Task> => {
    const res = await apiClient.patch<TaskResponse>(`/tasks/${id}`, input);
    const task = res.data.data;
    if (!task) throw new Error('Unexpected response from update task');
    return task;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/tasks/${id}`);
  },
};
