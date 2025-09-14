// src/lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection with your credentials
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:ala1nna@localhost:5432/visual_historian';

// Create the connection
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create the drizzle instance
export const db = drizzle(client, { schema });

// For raw SQL queries if needed
export const sql = client;

// Close connection (for cleanup)
export const closeConnection = () => client.end();

// Test connection function
export async function testConnection() {
  try {
    const result = await client`SELECT 1 as test`;
    console.log('Database connection successful:', result);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// src/lib/db/raw.ts - for raw SQL execution
export async function execute(query: string, params: any[] = []) {
  try {
    return await client.unsafe(query, params);
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}