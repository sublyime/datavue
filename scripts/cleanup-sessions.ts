// scripts/cleanup-sessions.ts
import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

// Load environment variables
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

async function cleanupSessions() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set');
  }

  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('🧹 Cleaning up old sessions...');
    
    // Delete all existing sessions
    const result = await sql`DELETE FROM sessions`;
    console.log(`✅ Deleted ${result.count} old sessions`);
    
    // Verify cleanup
    const remaining = await sql`SELECT COUNT(*) FROM sessions`;
    console.log(`📋 Remaining sessions: ${remaining[0].count}`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await sql.end();
  }
}

cleanupSessions();