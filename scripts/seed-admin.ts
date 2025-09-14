// scripts/seed-admin.ts
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import * as bcrypt from 'bcrypt';

async function seedAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await db.insert(users).values({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'ADMIN',
      isActive: true,
    });

    console.log('✅ Admin user created: admin@example.com / admin123');
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}

seedAdmin();