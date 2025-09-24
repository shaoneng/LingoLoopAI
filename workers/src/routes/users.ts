import { Hono } from 'hono';
import type { AppEnv } from '../types';

const users = new Hono<AppEnv>();

users.all('*', (c) => c.json({ error: 'User routes not yet implemented in Cloudflare worker.' }, 501));

export default users;
