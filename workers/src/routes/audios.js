import { Hono } from 'hono';
const audios = new Hono();
audios.all('*', (c) => c.json({ error: 'Audio routes not yet implemented in Cloudflare worker.' }, 501));
export default audios;
