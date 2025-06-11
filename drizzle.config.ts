import { defineConfig } from 'drizzle-kit';

// Netlify provides NETLIFY_DATABASE_URL automatically
const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('NETLIFY_DATABASE_URL or DATABASE_URL is not set');

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: { url: databaseUrl },
	verbose: true,
	strict: true
});
