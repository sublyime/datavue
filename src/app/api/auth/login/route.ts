// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Login attempt');
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });

    if (!user) {
      console.log('❌ User not found:', email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.isActive) {
      console.log('❌ User inactive:', email);
      return NextResponse.json({ error: 'Account disabled' }, { status: 401 });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log('❌ Password mismatch for:', email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create session
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt
    });

    console.log('✅ Login successful for:', email);
    console.log('   Session token:', token.substring(0, 10) + '...');

    // Set cookie
    const response = NextResponse.json({ 
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

    response.cookies.set('session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}