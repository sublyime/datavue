// scripts/check-admin.ts
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function checkAdmin() {
  try {
    console.log('Checking for admin user...');
    
    const adminUser = await db.query.users.findFirst({
      where: eq(users.email, 'admin@example.com')
    });

    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log('ID:', adminUser.id);
      console.log('Email:', adminUser.email);
      console.log('Name:', adminUser.name);
      console.log('Role:', adminUser.role);
      console.log('Active:', adminUser.isActive);
    } else {
      console.log('❌ Admin user not found');
      console.log('Run: npx tsx scripts/seed-admin.ts');
    }
  } catch (error) {
    console.error('Error checking admin:', error);
  }
}

checkAdmin();