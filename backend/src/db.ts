import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './database/schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️ WARNING: DATABASE_URL is not defined in backend environment!');
}

export const pool = new Pool({
  connectionString: connectionString || '',
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });
console.log('🔌 Connected to Neon PostgreSQL database securely using connection pool (Express version)');
