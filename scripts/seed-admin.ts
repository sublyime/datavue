// scripts/seed-admin.ts
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file FIRST
const envPath = resolve(process.cwd(), '.env');
config({ path: envPath });

console.log('🔧 Loading .env from:', envPath);
console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL);

// Now import the database connection
import { db, isDbConnected } from '@/lib/db';
import { users } from '@/lib/db/schema';
import * as bcrypt from 'bcrypt';

async function seedAdmin() {
  try {
    console.log('🌱 Seeding admin user...');
    
    // Check if database is connected
    if (!db || !isDbConnected()) {
      throw new Error('Database is not connected. Please check your DATABASE_URL in .env file');
    }

    // First, test the database connection
    console.log('Testing database connection...');
    const testResult = await db.execute('SELECT version() as version');
    console.log('✅ Database connection successful');
    console.log('PostgreSQL version:', testResult.rows[0]?.version);

    // Check if admin already exists
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, 'admin@example.com')
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('Email:', existingAdmin.email);
      console.log('Name:', existingAdmin.name);
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    console.log('Creating admin user...');
    const result = await db.insert(users).values({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      isActive: true,
    }).returning();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 User ID:', result[0].id);

  } catch (error) {
    console.error('❌ Error seeding admin user:');
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    } else {
      console.error('Unknown error:', error);
    }
  }
}

seedAdmin();