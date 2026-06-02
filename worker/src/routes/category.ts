import { Hono } from 'hono';
import { success, fail } from '../utils/response';

const category = new Hono();

category.get('/', async (c) => {
  const db = c.env.DB;
  const familyId = c.get('familyId') as number;

  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const rows = await db.prepare(`
    SELECT c.id, c.name, c.icon, c.color, c.sort_order,
      COALESCE(SUM(ABS(t.amount)), 0) as month_amount
    FROM categories c
    LEFT JOIN transactions t ON t.category_id = c.id
      AND t.type = 'expense'
      AND t.transaction_date LIKE ?
    WHERE c.family_id = ?
    GROUP BY c.id
    ORDER BY c.sort_order
  `).bind(`${yearMonth}%`, familyId).all();

  return success(c, rows.results);
});

category.post('/', async (c) => {
  const db = c.env.DB;
  const familyId = c.get('familyId') as number;
  const { name, icon, color } = await c.req.json<{ name: string; icon: string; color: string }>();

  if (!name || !icon || !color) {
    return fail(c, 1001, '请填写完整信息');
  }

  const maxSort = await db.prepare(
    'SELECT MAX(sort_order) as max_sort FROM categories WHERE family_id = ?'
  ).bind(familyId).first<any>();

  const sortOrder = (maxSort?.max_sort ?? -1) + 1;

  const result = await db.prepare(
    'INSERT INTO categories (family_id, name, icon, color, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).bind(familyId, name, icon, color, sortOrder).run();

  return success(c, {
    id: result.meta.last_row_id,
    name, icon, color,
    sort_order: sortOrder,
    month_amount: 0,
  });
});

category.put('/:id', async (c) => {
  const db = c.env.DB;
  const familyId = c.get('familyId') as number;
  const id = Number(c.req.param('id'));
  const { name, icon, color } = await c.req.json<{ name: string; icon: string; color: string }>();

  const existing = await db.prepare(
    'SELECT id FROM categories WHERE id = ? AND family_id = ?'
  ).bind(id, familyId).first();
  if (!existing) {
    return fail(c, 3001, '分类不存在');
  }

  await db.prepare(
    'UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ? AND family_id = ?'
  ).bind(name, icon, color, id, familyId).run();

  return success(c, { id, name, icon, color });
});

category.delete('/:id', async (c) => {
  const db = c.env.DB;
  const familyId = c.get('familyId') as number;
  const id = Number(c.req.param('id'));

  const existing = await db.prepare(
    'SELECT id FROM categories WHERE id = ? AND family_id = ?'
  ).bind(id, familyId).first();
  if (!existing) {
    return fail(c, 3001, '分类不存在');
  }

  // 将关联流水的 category_id 设为 NULL
  await db.prepare(
    'UPDATE transactions SET category_id = NULL WHERE category_id = ? AND family_id = ?'
  ).bind(id, familyId).run();

  await db.prepare(
    'DELETE FROM categories WHERE id = ? AND family_id = ?'
  ).bind(id, familyId).run();

  return success(c);
});

export { category as categoryRoutes };
