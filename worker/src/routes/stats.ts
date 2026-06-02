import { Hono } from 'hono';
import { success } from '../utils/response';

const stats = new Hono();

stats.get('/monthly', async (c) => {
  const db = c.env.DB;
  const familyId = c.get('familyId') as number;
  const year = c.req.query('year') || String(new Date().getFullYear());
  const month = c.req.query('month') || String(new Date().getMonth() + 1);
  const ym = `${year}-${String(month).padStart(2, '0')}`;

  const row = await db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END), 0) as expense
    FROM transactions
    WHERE family_id = ? AND type != 'transfer' AND transaction_date LIKE ?
  `).bind(familyId, `${ym}%`).first<any>();

  const income = Number(row?.income || 0);
  const expense = Number(row?.expense || 0);

  return success(c, { year: Number(year), month: Number(month), income, expense, balance: income - expense });
});

stats.get('/yearly', async (c) => {
  const db = c.env.DB;
  const familyId = c.get('familyId') as number;
  const year = c.req.query('year') || String(new Date().getFullYear());

  const row = await db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END), 0) as expense
    FROM transactions
    WHERE family_id = ? AND type != 'transfer' AND transaction_date LIKE ?
  `).bind(familyId, `${year}%`).first<any>();

  const monthly = await db.prepare(`
    SELECT
      CAST(strftime('%m', transaction_date) AS INTEGER) as month,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN ABS(amount) ELSE 0 END), 0) as expense
    FROM transactions
    WHERE family_id = ? AND type != 'transfer' AND transaction_date LIKE ?
    GROUP BY strftime('%m', transaction_date)
    ORDER BY month
  `).bind(familyId, `${year}%`).all<any>();

  const income = Number(row?.income || 0);
  const expense = Number(row?.expense || 0);

  return success(c, {
    year: Number(year), income, expense, balance: income - expense,
    monthly: monthly.results.map((m: any) => ({
      month: m.month, income: Number(m.income), expense: Number(m.expense),
    })),
  });
});

stats.get('/categories', async (c) => {
  const db = c.env.DB;
  const familyId = c.get('familyId') as number;
  const year = c.req.query('year') || String(new Date().getFullYear());
  const month = c.req.query('month') || String(new Date().getMonth() + 1);
  const ym = `${year}-${String(month).padStart(2, '0')}`;

  const rows = await db.prepare(`
    SELECT c.id, c.name, c.icon, c.color,
      COALESCE(SUM(ABS(t.amount)), 0) as amount
    FROM categories c
    LEFT JOIN transactions t ON t.category_id = c.id AND t.type = 'expense' AND t.transaction_date LIKE ?
    WHERE c.family_id = ?
    GROUP BY c.id
    HAVING amount > 0
    ORDER BY amount DESC
  `).bind(`${ym}%`, familyId).all<any>();

  const totalExpense = rows.results.reduce((sum: number, r: any) => sum + Number(r.amount), 0);

  return success(c, {
    total_expense: totalExpense,
    categories: rows.results.map((r: any) => ({
      id: r.id, name: r.name, icon: r.icon, color: r.color,
      amount: Number(r.amount),
      percent: totalExpense ? Math.round((Number(r.amount) / totalExpense) * 10000) / 100 : 0,
    })),
  });
});

stats.get('/members', async (c) => {
  const db = c.env.DB;
  const familyId = c.get('familyId') as number;
  const year = c.req.query('year') || String(new Date().getFullYear());
  const month = c.req.query('month') || String(new Date().getMonth() + 1);
  const ym = `${year}-${String(month).padStart(2, '0')}`;

  const rows = await db.prepare(`
    SELECT member_nickname as nickname,
      COALESCE(SUM(ABS(amount)), 0) as amount
    FROM transactions
    WHERE family_id = ? AND type = 'expense' AND transaction_date LIKE ?
    GROUP BY member_nickname
    ORDER BY amount DESC
  `).bind(familyId, `${ym}%`).all<any>();

  const totalExpense = rows.results.reduce((sum: number, r: any) => sum + Number(r.amount), 0);

  return success(c, {
    total_expense: totalExpense,
    members: rows.results.map((r: any) => ({
      nickname: r.nickname,
      amount: Number(r.amount),
      percent: totalExpense ? Math.round((Number(r.amount) / totalExpense) * 10000) / 100 : 0,
    })),
  });
});

export { stats as statsRoutes };
