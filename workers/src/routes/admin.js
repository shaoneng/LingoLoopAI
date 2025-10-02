import { Hono } from 'hono';
const admin = new Hono();
admin.all('*', (c) => c.json({ error: 'Admin routes not yet implemented in Cloudflare worker.' }, 501));
export default admin;
