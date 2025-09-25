import { Hono } from 'hono';
const users = new Hono();
users.all('*', (c) => c.json({ error: 'User routes not yet implemented in Cloudflare worker.' }, 501));
export default users;
