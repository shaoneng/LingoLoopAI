import { Hono } from 'hono';
import type { AppEnv } from '../types';

const audios = new Hono<AppEnv>();

audios.all('*', (c) => c.json({ error: 'Audio routes not yet implemented in Cloudflare worker.' }, 501));

export default audios;
