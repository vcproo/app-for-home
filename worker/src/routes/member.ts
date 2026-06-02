import { Hono } from 'hono';
import { success, fail } from '../utils/response';
import { signToken } from '../utils/jwt';

const member = new Hono();

member.get('/', async (c) => {
  const db = c.env.DB;
  const familyId = c.get('familyId') as number;

  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const members = await db.prepare(`
    SELECT fm.user_id, fm.nickname, fm.relation, fm.role,
      COALESCE(SUM(ABS(t.amount)), 0) as month_amount
    FROM family_members fm
    LEFT JOIN transactions t ON t.member_nickname = fm.nickname
      AND t.family_id = fm.family_id AND t.type = 'expense'
      AND t.transaction_date LIKE ?
    WHERE fm.family_id = ?
    GROUP BY fm.user_id
    ORDER BY fm.role DESC, fm.joined_at
  `).bind(`${ym}%`, familyId).all<any>();

  const totalRow = await db.prepare(
    'SELECT COUNT(*) as count FROM transactions WHERE family_id = ? AND transaction_date LIKE ?'
  ).bind(familyId, `${ym}%`).first<any>();

  return success(c, {
    members: members.results.map((m: any) => ({
      user_id: m.user_id, nickname: m.nickname, relation: m.relation,
      role: m.role, month_amount: Number(m.month_amount),
    })),
    total_transactions: totalRow?.count || 0,
  });
});

member.put('/me', async (c) => {
  const db = c.env.DB;
  const userId = c.get('userId') as number;
  const familyId = c.get('familyId') as number;
  const { nickname, relation } = await c.req.json<{ nickname: string; relation: string }>();

  if (!nickname) {
    return fail(c, 1001, '请填写昵称');
  }

  const old = await db.prepare(
    'SELECT nickname FROM family_members WHERE family_id = ? AND user_id = ?'
  ).bind(familyId, userId).first<any>();

  await db.prepare(
    'UPDATE family_members SET nickname = ?, relation = ? WHERE family_id = ? AND user_id = ?'
  ).bind(nickname, relation || '家庭成员', familyId, userId).run();

  // 同步更新流水中的昵称
  if (old && old.nickname !== nickname) {
    await db.prepare(
      'UPDATE transactions SET member_nickname = ? WHERE family_id = ? AND user_id = ?'
    ).bind(nickname, familyId, userId).run();

    // 更新资产所属人
    await db.prepare(
      'UPDATE assets SET owner_nickname = ? WHERE family_id = ? AND owner_nickname = ?'
    ).bind(nickname, familyId, old.nickname).run();
  }

  const token = await signToken({ userId, familyId, nickname }, c.env.JWT_SECRET);

  return success(c, { token, nickname, relation });
});

export { member as memberRoutes };
