import { Hono } from 'hono';
import { success, fail } from '../utils/response';

const transaction = new Hono();

transaction.get('/', async (c) => {
  const db = c.env.DB;
  const familyId = c.get('familyId') as number;
  const year = c.req.query('year');
  const month = c.req.query('month');
  const type = c.req.query('type');
  const member = c.req.query('member');
  const page = Number(c.req.query('page') || '1');
  const pageSize = Math.min(Number(c.req.query('page_size') || '20'), 100);
  const offset = (page - 1) * pageSize;

  let where = 'WHERE t.family_id = ?';
  const params: any[] = [familyId];

  if (year && month) {
    const ym = `${year}-${String(month).padStart(2, '0')}`;
    where += ' AND t.transaction_date LIKE ?';
    params.push(`${ym}%`);
  } else if (year) {
    where += ' AND t.transaction_date LIKE ?';
    params.push(`${year}%`);
  }

  if (type) {
    where += ' AND t.type = ?';
    params.push(type);
  }
  if (member) {
    where += ' AND t.member_nickname = ?';
    params.push(member);
  }

  const countRow = await db.prepare(
    `SELECT COUNT(*) as total FROM transactions t ${where}`
  ).bind(...params).first<any>();

  const rows = await db.prepare(`
    SELECT t.id, t.type, t.amount, t.member_nickname, t.note, t.transaction_date, t.created_at,
      t.asset_id, t.transfer_to_asset_id, t.category_id,
      c.name as cat_name, c.icon as cat_icon, c.color as cat_color,
      a.name as asset_name,
      ta.name as to_asset_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN assets a ON t.asset_id = a.id
    LEFT JOIN assets ta ON t.transfer_to_asset_id = ta.id
    ${where}
    ORDER BY t.transaction_date DESC, t.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, pageSize, offset).all<any>();

  const list = rows.results.map((r: any) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    member_nickname: r.member_nickname,
    note: r.note,
    transaction_date: r.transaction_date,
    created_at: r.created_at,
    category: r.cat_name ? { id: r.category_id, name: r.cat_name, icon: r.cat_icon, color: r.cat_color } : null,
    asset: r.asset_name ? { id: r.asset_id, name: r.asset_name } : null,
    transfer_to_asset: r.to_asset_name ? { id: r.transfer_to_asset_id, name: r.to_asset_name } : null,
  }));

  return success(c, {
    list,
    total: countRow?.total || 0,
    page,
    page_size: pageSize,
  });
});

transaction.post('/', async (c) => {
  const db = c.env.DB;
  const familyId = c.get('familyId') as number;
  const userId = c.get('userId') as number;
  const nickname = c.get('nickname') as string;
  const body = await c.req.json<{
    type: string; amount: number; category_id?: number;
    asset_id?: number; note?: string; transaction_date: string;
  }>();

  if (!body.amount || body.amount <= 0) {
    return fail(c, 1001, '请输入正确金额');
  }
  if (!body.transaction_date) {
    return fail(c, 1001, '请选择日期');
  }

  const amount = body.type === 'expense' ? -Math.abs(body.amount) : Math.abs(body.amount);

  const result = await db.prepare(
    `INSERT INTO transactions (family_id, user_id, member_nickname, type, amount, category_id, asset_id, note, transaction_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    familyId, userId, nickname, body.type, amount,
    body.category_id || null, body.asset_id || null,
    body.note || null, body.transaction_date
  ).run();

  // 更新资产余额
  if (body.asset_id) {
    await db.prepare(
      'UPDATE assets SET balance = balance + ? WHERE id = ? AND family_id = ?'
    ).bind(amount, body.asset_id, familyId).run();
  }

  return success(c, {
    id: result.meta.last_row_id,
    type: body.type, amount, member_nickname: nickname,
    category_id: body.category_id, asset_id: body.asset_id,
    note: body.note, transaction_date: body.transaction_date,
  });
});

transaction.put('/:id', async (c) => {
  const db = c.env.DB;
  const familyId = c.get('familyId') as number;
  const userId = c.get('userId') as number;
  const id = Number(c.req.param('id'));
  const body = await c.req.json<{ amount?: number; note?: string; category_id?: number }>();

  const existing = await db.prepare(
    'SELECT * FROM transactions WHERE id = ? AND family_id = ? AND user_id = ?'
  ).bind(id, familyId, userId).first<any>();
  if (!existing) {
    return fail(c, 4001, '流水不存在');
  }

  // 如果修改了金额，需要回退旧资产余额
  if (body.amount !== undefined && existing.asset_id) {
    const oldAmount = Number(existing.amount);
    const newAmount = existing.type === 'expense' ? -Math.abs(body.amount) : Math.abs(body.amount);
    const diff = newAmount - oldAmount;

    await db.prepare(
      'UPDATE assets SET balance = balance + ? WHERE id = ? AND family_id = ?'
    ).bind(diff, existing.asset_id, familyId).run();

    await db.prepare(
      'UPDATE transactions SET amount = ? WHERE id = ?'
    ).bind(newAmount, id).run();
  }

  if (body.note !== undefined) {
    await db.prepare('UPDATE transactions SET note = ? WHERE id = ?').bind(body.note, id).run();
  }
  if (body.category_id !== undefined) {
    await db.prepare('UPDATE transactions SET category_id = ? WHERE id = ?').bind(body.category_id, id).run();
  }

  return success(c);
});

transaction.delete('/:id', async (c) => {
  const db = c.env.DB;
  const familyId = c.get('familyId') as number;
  const userId = c.get('userId') as number;
  const id = Number(c.req.param('id'));

  const existing = await db.prepare(
    'SELECT * FROM transactions WHERE id = ? AND family_id = ? AND user_id = ?'
  ).bind(id, familyId, userId).first<any>();
  if (!existing) {
    return fail(c, 4001, '流水不存在');
  }

  // 回退资产余额
  if (existing.asset_id) {
    await db.prepare(
      'UPDATE assets SET balance = balance - ? WHERE id = ? AND family_id = ?'
    ).bind(Number(existing.amount), existing.asset_id, familyId).run();
  }

  await db.prepare('DELETE FROM transactions WHERE id = ?').bind(id).run();

  return success(c);
});

export { transaction as transactionRoutes };
