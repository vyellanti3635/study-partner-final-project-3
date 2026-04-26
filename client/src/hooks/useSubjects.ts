import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subjectsApi } from '../api/subjects';

export const subjectKeys = {
  all: ['subjects'] as const,
  lists: () => [...subjectKeys.all, 'list'] as const,
};

export function useSubjectsList() {
  return useQuery({
    queryKey: subjectKeys.lists(),
    queryFn: () => subjectsApi.list(),
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => subjectsApi.create(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: subjectKeys.all });
    },
  });
}
