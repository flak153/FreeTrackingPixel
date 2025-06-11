import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

// Use Netlify's database URL if available, otherwise fall back to DATABASE_URL
const databaseUrl = env.NETLIFY_DATABASE_URL || env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error('DATABASE_URL or NETLIFY_DATABASE_URL must be set');
}

const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });
