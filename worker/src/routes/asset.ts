import { Hono } from 'hono';
import { success, fail } from '../utils/response';

const asset = new Hono();

asset.get('/', async (c) => {
  const db = c.env.DB;
  const familyId = c.get('familyId') as number;

  const rows = await db.prepare(
    'SELECT id, name, balance, owner_nickname, hidden FROM assets WHERE family_id = ? ORDER BY created_at'
  ).bind(familyId).all<any>();

  const assets = rows.results.filter((a: any) => !a.hidden);
  const hiddenAssets = rows.results.filter((a: any) => a.hidden);
  const totalBalance = assets.reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);

  return success(c, {
    total_balance: totalBalance,
    assets: assets.map((a: any) => ({
      id: a.id, name: a.name, balance: Number(a.balance),
      owner_nickname: a.owner_nickname, hidden: false,
    })),
    hidden_assets: hiddenAssets.map((a: any) => ({
      id: a.id, name: a.name, balance: Number(a.balance),
      owner_nickname: a.owner_nickname, hidden: true,
    })),
  });
});

asset.post('/', async (c) => {
  const db = c.env.DB;
  const familyId = c.get('familyId') as number;
  const nickname = c.get('nickname') as string;
  const { name, balance } = await c.req.json<{ name: string; balance: number }>();

  if (!name) {
    return fail(c, 1001, '请输入资产名称');
  }

  const result = await db.prepare(
    'INSERT INTO assets (family_id, name, balance, owner_nickname) VALUES (?, ?, ?, ?)'
  ).bind(familyId, name, balance || 0, nickname).run();

  return success(c, {
    id: result.meta.last_row_id,
    name, balance: Number(balance || 0),
    owner_nickname: nickname, hidden: false,
  });
});

asset.put('/:id', async (c) => {
  const db = c.env.DB;
  const familyId = c.get('familyId') as number;
  const id = Number(c.req.param('id'));
  const { name, balance } = await c.req.json<{ name: string; balance: number }>();

  const existing = await db.prepare(
    'SELECT id FROM assets WHERE id = ? AND family_id = ?'
  ).bind(id, familyId).first();
  if (!existing) {
    return fail(c, 3002, '资产不存在');
  }

  await db.prepare(
    'UPDATE assets SET name = ?, balance = ? WHERE id = ? AND family_id = ?'
  ).bind(name, balance, id, familyId).run();

  return success(c, { id, name, balance: Number(balance) });
});

asset.put('/:id/hide', async (c) => {
  const db = c.env.DB;
  const familyId = c.get('familyId') as number;
  const id = Number(c.req.param('id'));
  const { hidden } = await c.req.json<{ hidden: boolean }>();

  await db.prepare(
    'UPDATE assets SET hidden = ? WHERE id = ? AND family_id = ?'
  ).bind(hidden ? 1 : 0, id, familyId).run();

  return success(c);
});

asset.post('/transfer', async (c) => {
  const db = c.env.DB;
  const familyId = c.get('familyId') as number;
  const nickname = c.get('nickname') as string;
  const { from_asset_id, to_asset_id, amount } = await c.req.json<{
    from_asset_id: number; to_asset_id: number; amount: number;
  }>();

  if (from_asset_id === to_asset_id) {
    return fail(c, 3004, '不能转给自己');
  }
  if (!amount || amount <= 0) {
    return fail(c, 1001, '请输入正确金额');
  }

  const fromAsset = await db.prepare(
    'SELECT id, name, balance FROM assets WHERE id = ? AND family_id = ?'
  ).bind(from_asset_id, familyId).first<any>();
  const toAsset = await db.prepare(
    'SELECT id, name, balance FROM assets WHERE id = ? AND family_id = ?'
  ).bind(to_asset_id, familyId).first<any>();

  if (!fromAsset || !toAsset) {
    return fail(c, 3002, '资产不存在');
  }
  if (Number(fromAsset.balance) < amount) {
    return fail(c, 3003, '转出账户余额不足');
  }

  const newFromBalance = Number(fromAsset.balance) - amount;
  const newToBalance = Number(toAsset.balance) + amount;

  await db.batch([
    db.prepare('UPDATE assets SET balance = ? WHERE id = ?').bind(newFromBalance, from_asset_id),
    db.prepare('UPDATE assets SET balance = ? WHERE id = ?').bind(newToBalance, to_asset_id),
    db.prepare(
      'INSERT INTO transactions (family_id, user_id, member_nickname, type, amount, asset_id, transfer_to_asset_id, note, transaction_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      familyId, c.get('userId'), nickname, 'transfer', 0,
      from_asset_id, to_asset_id,
      `${fromAsset.name} → ${toAsset.name}`,
      new Date().toISOString().slice(0, 10)
    ),
  ]);

  return success(c, {
    from_asset: { id: from_asset_id, name: fromAsset.name, balance: newFromBalance },
    to_asset: { id: to_asset_id, name: toAsset.name, balance: newToBalance },
  });
});

export { asset as assetRoutes };
