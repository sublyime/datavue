// src/lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Create a function to initialize the database connection
function createDbClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // Don't throw error immediately - just return null
    console.warn('⚠️ DATABASE_URL environment variable is not set');
    return null;
  }

  console.log('🔗 Database URL:', connectionString);
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}

// Create the db instance
export const db = createDbClient();

// Export a function to check if db is connected
export function isDbConnected() {
  return db !== null;
}

export type Database = typeof db;