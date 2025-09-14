// scripts/seed-admin-direct.ts
import { config } from 'dotenv';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/lib/db/schema';
import * as bcrypt from 'bcrypt';

// Load environment variables from .env file
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

console.log('🔧 Loading .env from:', envPath);
console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL);

async function seedAdmin() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Create direct database connection
  const client = postgres(process.env.DATABASE_URL);
  const db = drizzle(client, { schema });

  try {
    console.log('🌱 Seeding admin user...');
    
    // Test connection - use a simpler approach
    console.log('Testing database connection...');
    const testResult = await client`SELECT version() as version`;
    console.log('✅ Database connection successful');
    console.log('PostgreSQL version:', testResult[0]?.version);

    // Check if users table exists
    console.log('Checking if users table exists...');
    const tableCheck = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `;
    
    if (!tableCheck[0]?.exists) {
      console.log('❌ Users table does not exist. Please run your database migrations first.');
      return;
    }

    // Check if admin already exists using direct SQL
    const existingAdmin = await client`
      SELECT * FROM users WHERE email = 'admin@example.com'
    `;

    if (existingAdmin.length > 0) {
      console.log('✅ Admin user already exists');
      console.log('Email:', existingAdmin[0].email);
      console.log('Name:', existingAdmin[0].name);
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    console.log('Creating admin user...');
    const result = await client`
      INSERT INTO users (email, password, name, role, is_active)
      VALUES ('admin@example.com', ${hashedPassword}, 'System Administrator', 'ADMIN', true)
      RETURNING id, email, name
    `;

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', result[0].email);
    console.log('🔑 Password: admin123');
    console.log('🆔 User ID:', result[0].id);

  } catch (error) {
    console.error('❌ Error seeding admin user:');
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      
      // Check if it's a table doesn't exist error
      if (error.message.includes('relation "users" does not exist')) {
        console.log('💡 Solution: You need to run database migrations first');
        console.log('Run: npm run db:push or npm run db:migrate');
      }
    } else {
      console.error('Unknown error:', error);
    }
  } finally {
    await client.end();
  }
}

seedAdmin();