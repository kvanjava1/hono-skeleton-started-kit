import type { Context } from 'hono';

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message: string;
  data: T | null;
}

export const successResponse = <T>(
  c: Context,
  message: string,
  data: T | null = null,
  statusCode = 200
): Response => {
  const response: ApiResponse<T> = {
    status: 'success',
    message,
    data,
  };
  return c.json(response, statusCode as 200);
};

export const errorResponse = (
  c: Context,
  message: string,
  statusCode = 500,
  data: unknown = null
): Response => {
  const response: ApiResponse = {
    status: 'error',
    message,
    data,
  };
  return c.json(response, statusCode as 500);
};
