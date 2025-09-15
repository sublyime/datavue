// src/lib/auth-utils.ts
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

// Define a simple user type for the token payload
export interface UserPayload {
    id: number;
    email: string;
    role: string;
    name: string;
    isActive: boolean;
    // Add a key signature to satisfy jose's JWTPayload type
    [key: string]: unknown;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';
if (JWT_SECRET === 'your-super-secret-key') {
    console.warn('⚠️ WARNING: JWT_SECRET is not set. Please set it in your environment variables.');
}

export async function generateAuthToken(user: { id: number; email: string; role: string; name: string; isActive: boolean }): Promise<string> {
    const payload: UserPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        isActive: user.isActive,
    };
    const secret = new TextEncoder().encode(JWT_SECRET);
    return new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);
}

export async function verifyAuthToken(token: string): Promise<UserPayload | null> {
    try {
        const secret = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jose.jwtVerify(token, secret);
        return payload as UserPayload;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

export async function authenticateUser(email: string, password: string) {
    const user = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (!user) {
        return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (isPasswordValid) {
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            isActive: user.isActive,
        };
    }

    return null;
}