// scripts/debug-raw-query.ts
import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

// Load environment variables
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

async function debugRawQuery() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set');
  }

  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('🔍 Debugging raw SQL queries...');
    
    // Test a simple query
    console.log('Testing users query...');
    const userResult = await sql`SELECT * FROM users WHERE email = ${'admin@example.com'}`;
    console.log('User result:', userResult);
    console.log('User result type:', typeof userResult);
    console.log('User result length:', Array.isArray(userResult) ? userResult.length : 'Not an array');
    
    // Test sessions query
    console.log('\nTesting sessions query...');
    const sessionResult = await sql`SELECT * FROM sessions LIMIT 1`;
    console.log('Session result:', sessionResult);
    console.log('Session result type:', typeof sessionResult);
    
    // Test parameterized query
    console.log('\nTesting parameterized query...');
    const paramResult = await sql.unsafe('SELECT * FROM users WHERE email = $1', ['admin@example.com']);
    console.log('Parameterized result:', paramResult);
    console.log('Parameterized result type:', typeof paramResult);
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await sql.end();
  }
}

debugRawQuery();