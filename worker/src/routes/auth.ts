import { Hono } from 'hono';
import { success, fail } from '../utils/response';
import { hashPassword, generateSalt } from '../utils/md5';
import { signToken } from '../utils/jwt';

const auth = new Hono();

auth.post('/register', async (c) => {
  const db = c.env.DB;
  const { phone, password } = await c.req.json<{ phone: string; password: string }>();

  if (!/^1\d{10}$/.test(phone)) {
    return fail(c, 1001, '手机号格式错误');
  }
  if (!password || password.length < 6) {
    return fail(c, 1002, '密码长度不足');
  }

  const existing = await db.prepare('SELECT id FROM users WHERE phone = ?').bind(phone).first();
  if (existing) {
    return fail(c, 1003, '手机号已注册', 409);
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);

  const result = await db.prepare(
    'INSERT INTO users (phone, password_hash, salt) VALUES (?, ?, ?)'
  ).bind(phone, passwordHash, salt).run();

  const userId = result.meta.last_row_id as number;
  const token = await signToken({ userId, familyId: null, nickname: null }, c.env.JWT_SECRET);

  return success(c, {
    token,
    user: { id: userId, phone: phone.slice(0, 3) + '****' + phone.slice(7) },
  });
});

auth.post('/login', async (c) => {
  const db = c.env.DB;
  const { phone, password } = await c.req.json<{ phone: string; password: string }>();

  if (!/^1\d{10}$/.test(phone)) {
    return fail(c, 1001, '手机号格式错误');
  }
  if (!password || password.length < 6) {
    return fail(c, 1002, '密码长度不足');
  }

  const user = await db.prepare(
    'SELECT id, password_hash, salt FROM users WHERE phone = ?'
  ).bind(phone).first<any>();

  if (!user) {
    return fail(c, 1004, '手机号或密码错误', 401);
  }

  const hash = await hashPassword(password, user.salt);
  if (hash !== user.password_hash) {
    return fail(c, 1004, '手机号或密码错误', 401);
  }

  const member = await db.prepare(
    'SELECT fm.family_id, fm.nickname, fm.relation FROM family_members fm WHERE fm.user_id = ?'
  ).bind(user.id).first<any>();

  const familyId = member?.family_id || null;
  const nickname = member?.nickname || null;

  const token = await signToken({ userId: user.id, familyId, nickname }, c.env.JWT_SECRET);

  return success(c, {
    token,
    user: {
      id: user.id,
      phone: phone.slice(0, 3) + '****' + phone.slice(7),
      family_id: familyId,
      nickname,
      relation: member?.relation || null,
    },
  });
});

export { auth as authRoutes };
