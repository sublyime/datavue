// app/api/debug/db/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test basic query
    const testQuery = await db.execute('SELECT 1 as test');
    console.log('Basic query test passed');
    
    // Check if users table exists and has data
    const userCount = await db.select().from(users);
    console.log('Users in database:', userCount.length);
    
    return NextResponse.json({ 
      success: true, 
      userCount: userCount.length,
      users: userCount
    });
    
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}