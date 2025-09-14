import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';

// Simple password verification function (replaces bcrypt.compare)
async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // Hash the provided password using the same algorithm as the hashPassword function
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  const providedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Compare the hashes
  return providedHash === hashedPassword;
}

// POST /api/auth/login - User login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, body.email),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(body.password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate session token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // Create session
    await db.insert(sessions).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // Return user info (without password) and token
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json({
      user: userWithoutPassword,
      token,
      expiresAt,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}