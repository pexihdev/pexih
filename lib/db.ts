import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:dummy@localhost:5432/yondaime?sslmode=require';
const pool = new Pool({ connectionString });
export const db = drizzle(pool);
