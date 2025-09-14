// scripts/debug-auth.ts
import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

// Load environment variables
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

async function debugAuth() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set');
  }

  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('🔍 Debugging authentication...');
    
    // Check users
    const users = await sql`SELECT * FROM users`;
    console.log('👤 Users:', users.length);
    users.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user.id}, Active: ${user.is_active})`);
    });

    // Check sessions
    const sessions = await sql`SELECT * FROM sessions`;
    console.log('📋 Sessions:', sessions.length);
    sessions.forEach(session => {
      console.log(`   - Token: ${session.token.substring(0, 10)}... (User ID: ${session.user_id}, Expires: ${session.expires_at})`);
    });

    // Check if there are any relationship issues
    const userSessions = await sql`
      SELECT u.email, s.token, s.expires_at 
      FROM users u 
      JOIN sessions s ON u.id = s.user_id
    `;
    console.log('🔗 User sessions:', userSessions.length);

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await sql.end();
  }
}

debugAuth();