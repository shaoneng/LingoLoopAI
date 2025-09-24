import { Hono } from 'hono';
import type { AppEnv } from '../types';

const admin = new Hono<AppEnv>();

admin.all('*', (c) => c.json({ error: 'Admin routes not yet implemented in Cloudflare worker.' }, 501));

export default admin;
