export type Priority = 'Low' | 'Medium' | 'High';
export type Status = 'Not Started' | 'In Progress' | 'Completed';

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string; // ISO 8601
};

export type Subject = {
  id: string;
  name: string;
  createdAt: string;
};

export type Task = {
  id: string;
  subjectId: string;
  title: string;
  notes?: string;
  dueDate: string; // ISO 8601 date
  priority: Priority;
  status: Status;
  createdAt: string;
  updatedAt: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: { message: string; fields?: Record<string, string> } | null;
  meta?: { total: number; page: number; limit: number };
};
