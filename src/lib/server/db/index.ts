import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@netlify/neon';
import * as schema from './schema';

// Netlify automatically provides NETLIFY_DATABASE_URL
const sql = neon();

export const db = drizzle(sql, { schema });
