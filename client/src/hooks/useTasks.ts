import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, type TasksQuery } from '../api/tasks';
import type { TaskCreateInput } from '../schemas/task.schema';

// Query key factory — keeps key structure consistent everywhere
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (query: TasksQuery) => [...taskKeys.lists(), query] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  stats: () => [...taskKeys.all, 'stats'] as const,
  today: () => [...taskKeys.all, 'today'] as const,
  upcoming: () => [...taskKeys.all, 'upcoming'] as const,
};

export function useTasksList(query: TasksQuery = {}) {
  return useQuery({
    queryKey: taskKeys.list(query),
    queryFn: () => tasksApi.list(query),
  });
}

export function useTaskById(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksApi.getById(id),
    enabled: Boolean(id),
    retry: (failureCount, error: unknown) => {
      // Do not retry on 404
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        (error as { response?: { status?: number } }).response?.status === 404
      ) {
        return false;
      }
      return failureCount < 1;
    },
  });
}

export function useTodayTasks() {
  return useQuery({
    queryKey: taskKeys.today(),
    queryFn: () => tasksApi.today(),
  });
}

export function useUpcomingTasks() {
  return useQuery({
    queryKey: taskKeys.upcoming(),
    queryFn: () => tasksApi.upcoming(),
  });
}

export function useTaskStats() {
  return useQuery({
    queryKey: taskKeys.stats(),
    queryFn: () => tasksApi.stats(),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskCreateInput) => tasksApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TaskCreateInput> & { isComplete?: boolean } }) =>
      tasksApi.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
