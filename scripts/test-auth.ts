// scripts/test-auth.ts
import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

// Load environment variables
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

async function testAuth() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set');
  }

  const sql = postgres(process.env.DATABASE_URL);

  try {
    console.log('🔐 Testing authentication flow...');
    
    // 1. Check if admin user exists
    const adminUser = await sql`
      SELECT * FROM users WHERE email = 'admin@example.com'
    `;
    
    console.log('👤 Admin user:', adminUser[0] ? 'Exists' : 'Not found');
    if (adminUser[0]) {
      console.log('   Email:', adminUser[0].email);
      console.log('   Password hash:', adminUser[0].password.substring(0, 20) + '...');
    }

    // 2. Check sessions
    const sessions = await sql`SELECT * FROM sessions`;
    console.log('📋 Sessions count:', sessions.length);
    
    if (sessions.length > 0) {
      console.log('   Latest session:', {
        token: sessions[0].token.substring(0, 10) + '...',
        userId: sessions[0].user_id,
        expiresAt: sessions[0].expires_at
      });
    }

    // 3. Test password verification
    if (adminUser[0]) {
      const bcrypt = await import('bcrypt');
      const passwordMatch = await bcrypt.compare('admin123', adminUser[0].password);
      console.log('🔑 Password verification:', passwordMatch ? '✅ Success' : '❌ Failed');
    }

  } catch (error) {
    console.error('❌ Auth test failed:', error);
  } finally {
    await sql.end();
  }
}

testAuth();