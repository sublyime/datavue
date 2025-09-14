// lib/db/raw.ts
import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

// Load environment variables
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

// Create raw PostgreSQL client
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export const sql = postgres(connectionString);

// Utility functions for raw SQL queries
export async function query<T = any>(text: string, params?: any[]): Promise<{ rows: T[] }> {
  const rows = await sql.unsafe<T[]>(text, params);
  return { rows };
}

export async function execute(text: string, params?: any[]): Promise<{ rows: any[] }> {
  const rows = await sql.unsafe(text, params);
  return { rows };
}