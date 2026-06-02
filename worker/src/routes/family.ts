import { Hono } from 'hono';
import { success, fail } from '../utils/response';
import { signToken } from '../utils/jwt';
import { generateInviteCode, DEFAULT_CATEGORIES } from '../db/queries';

const family = new Hono();

family.post('/create', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId') as number;
  const { name, nickname } = await c.req.json<{ name: string; nickname: string }>();

  if (!nickname) {
    return fail(c, 1001, '请填写昵称');
  }

  const existing = await db.prepare(
    'SELECT family_id FROM family_members WHERE user_id = ?'
  ).bind(userId).first();
  if (existing) {
    return fail(c, 2002, '已经拥有家庭', 409);
  }

  const inviteCode = generateInviteCode();
  const result = await db.prepare(
    'INSERT INTO families (name, invite_code, creator_id) VALUES (?, ?, ?)'
  ).bind(name || '我的家庭', inviteCode, userId).run();

  const familyId = result.meta.last_row_id as number;

  await db.prepare(
    'INSERT INTO family_members (family_id, user_id, nickname, relation, role) VALUES (?, ?, ?, ?, ?)'
  ).bind(familyId, userId, nickname, '本人', 'owner').run();

  // 创建默认分类
  const stmt = db.prepare(
    'INSERT INTO categories (family_id, name, icon, color, sort_order) VALUES (?, ?, ?, ?, ?)'
  );
  const batch = DEFAULT_CATEGORIES.map((cat, i) =>
    stmt.bind(familyId, cat.name, cat.icon, cat.color, i)
  );
  await db.batch(batch);

  const token = await signToken({ userId, familyId, nickname }, c.env.JWT_SECRET);

  return success(c, {
    token,
    family: { id: familyId, name: name || '我的家庭', invite_code: inviteCode },
  });
});

family.post('/join', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId') as number;
  const { invite_code, nickname } = await c.req.json<{ invite_code: string; nickname: string }>();

  if (!nickname) {
    return fail(c, 1001, '请填写昵称');
  }
  if (!invite_code) {
    return fail(c, 1001, '请输入邀请码');
  }

  const fam = await db.prepare(
    'SELECT id, name FROM families WHERE invite_code = ?'
  ).bind(invite_code).first<any>();
  if (!fam) {
    return fail(c, 2001, '邀请码无效');
  }

  const existing = await db.prepare(
    'SELECT id FROM family_members WHERE family_id = ? AND user_id = ?'
  ).bind(fam.id, userId).first();
  if (existing) {
    return fail(c, 2002, '已经加入该家庭', 409);
  }

  await db.prepare(
    'INSERT INTO family_members (family_id, user_id, nickname, relation) VALUES (?, ?, ?, ?)'
  ).bind(fam.id, userId, nickname, '家庭成员').run();

  const token = await signToken({ userId, familyId: fam.id, nickname }, c.env.JWT_SECRET);

  return success(c, {
    token,
    family: { id: fam.id, name: fam.name },
  });
});

family.get('/info', async (c) => {
  const db = c.env.DB;
  const familyId = c.get('familyId') as number;

  const fam = await db.prepare(
    'SELECT id, name, invite_code, created_at FROM families WHERE id = ?'
  ).bind(familyId).first<any>();

  if (!fam) {
    return fail(c, 2001, '家庭不存在');
  }

  const count = await db.prepare(
    'SELECT COUNT(*) as count FROM family_members WHERE family_id = ?'
  ).bind(familyId).first<any>();

  return success(c, {
    id: fam.id,
    name: fam.name,
    invite_code: fam.invite_code,
    member_count: count?.count || 0,
    created_at: fam.created_at,
  });
});

family.post('/leave', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId') as number;
  const familyId = c.get('familyId') as number;

  await db.prepare(
    'DELETE FROM family_members WHERE family_id = ? AND user_id = ?'
  ).bind(familyId, userId).run();

  const token = await signToken({ userId, familyId: null, nickname: null }, c.env.JWT_SECRET);

  return success(c, { token });
});

export { family as familyRoutes };
