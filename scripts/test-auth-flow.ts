// scripts/test-auth-flow.ts
import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

// Load environment variables
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

async function testAuthFlow() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set');
  }

  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('🔐 Testing authentication flow...');
    
    // 1. Test user lookup
    const userResult = await sql`
      SELECT * FROM users WHERE email = 'admin@example.com'
    `;
    console.log('✅ User lookup:', userResult.length > 0 ? 'Success' : 'Failed');
    
    // 2. Test password verification
    if (userResult.length > 0) {
      const bcrypt = await import('bcrypt');
      const passwordMatch = await bcrypt.compare('admin123', userResult[0].password);
      console.log('✅ Password verification:', passwordMatch ? 'Success' : 'Failed');
    }
    
    // 3. Test session creation
    const token = 'test_token_' + Math.random().toString(36).substring(2);
    await sql`
      INSERT INTO sessions (user_id, token, expires_at) 
      VALUES (1, ${token}, NOW() + INTERVAL '7 days')
    `;
    console.log('✅ Session creation: Success');
    
    // 4. Test session lookup
    const sessionResult = await sql`
      SELECT s.*, u.email 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.token = ${token}
    `;
    console.log('✅ Session lookup:', sessionResult.length > 0 ? 'Success' : 'Failed');
    
    if (sessionResult.length > 0) {
      console.log('   User email:', sessionResult[0].email);
    }
    
    // Cleanup test session
    await sql`DELETE FROM sessions WHERE token = ${token}`;

  } catch (error) {
    console.error('❌ Auth flow test failed:', error);
  } finally {
    await sql.end();
  }
}

testAuthFlow();