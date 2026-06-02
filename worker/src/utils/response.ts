import type { Context } from 'hono';

export function success(c: Context, data: any = null) {
  return c.json({ code: 0, message: 'success', data });
}

export function fail(c: Context, code: number, message: string, status = 400) {
  return c.json({ code, message, data: null }, status as any);
}
