import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/visual_historian';
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export type Database = typeof db;