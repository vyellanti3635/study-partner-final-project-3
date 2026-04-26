export type Meta = {
  total: number;
  page: number;
  limit: number;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: { message: string; fields?: Record<string, string> } | null;
  meta?: Meta;
};

export function ok<T>(data: T, meta?: Meta): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
    ...(meta !== undefined ? { meta } : {}),
  };
}

export function err(
  message: string,
  fields?: Record<string, string>
): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error: {
      message,
      ...(fields !== undefined ? { fields } : {}),
    },
  };
}
