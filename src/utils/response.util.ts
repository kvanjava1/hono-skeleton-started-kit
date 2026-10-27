import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message: string;
  data: T | null;
  requestId?: string;
}

export const successResponse = <T>(
  c: Context,
  message: string,
  data: T | null = null,
  statusCode: ContentfulStatusCode = 200
): Response => {
  const response: ApiResponse<T> = {
    status: 'success',
    message,
    data,
  };
  return c.json(response, statusCode);
};

export const errorResponse = (
  c: Context,
  message: string,
  statusCode: ContentfulStatusCode = 500,
  data: unknown = null
): Response => {
  const requestId = typeof c.get === 'function' ? c.get('requestId') : undefined;
  const response: ApiResponse = {
    status: 'error',
    message,
    data,
    ...(requestId ? { requestId } : {}),
  };
  return c.json(response, statusCode);
};
