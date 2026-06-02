import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authMiddleware } from './middleware/auth';
import { authRoutes } from './routes/auth';
import { familyRoutes } from './routes/family';
import { categoryRoutes } from './routes/category';
import { assetRoutes } from './routes/asset';
import { transactionRoutes } from './routes/transaction';
import { statsRoutes } from './routes/stats';
import { memberRoutes } from './routes/member';

type Bindings = {
  DB: D1Database;
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

// 公开路由
app.route('/api/v1/auth', authRoutes);

// 需认证路由
const authed = new Hono<{ Bindings: Bindings }>();
authed.use('*', authMiddleware);
authed.route('/family', familyRoutes);
authed.route('/categories', categoryRoutes);
authed.route('/assets', assetRoutes);
authed.route('/transactions', transactionRoutes);
authed.route('/stats', statsRoutes);
authed.route('/members', memberRoutes);

app.route('/api/v1', authed);

app.get('/api/health', (c) => c.json({ status: 'ok', time: new Date().toISOString() }));

export default app;
