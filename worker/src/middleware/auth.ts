import type { Context, Next } from 'hono';
import { verifyToken } from '../utils/jwt';
import { fail } from '../utils/response';

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return fail(c, 1005, '未登录或 token 已过期', 401);
  }

  const token = authHeader.substring(7);
  const payload = await verifyToken(token, c.env.JWT_SECRET);
  if (!payload) {
    return fail(c, 1005, '未登录或 token 已过期', 401);
  }

  c.set('userId', payload.userId);
  c.set('familyId', payload.familyId);
  c.set('nickname', payload.nickname);

  await next();
}
