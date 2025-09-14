// middleware/auth.ts
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { sessions, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export interface AuthResult {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
  };
  error?: string;
  status: number;
}

export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    console.log('🔐 Auth middleware called');
    const token = request.cookies.get('session-token')?.value;
    
    if (!token) {
      console.log('❌ No session token found');
      return { error: 'No authentication token', status: 401 };
    }

    console.log('🔍 Checking session for token:', token.substring(0, 10) + '...');

    // Check session in database
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.token, token),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true
          }
        }
      }
    });

    if (!session) {
      console.log('❌ Session not found in database');
      return { error: 'Invalid session', status: 401 };
    }

    if (!session.user) {
      console.log('❌ User not found for session');
      return { error: 'User not found', status: 401 };
    }

    if (new Date(session.expiresAt) < new Date()) {
      console.log('❌ Session expired');
      return { error: 'Session expired', status: 401 };
    }

    if (!session.user.isActive) {
      console.log('❌ User account is disabled');
      return { error: 'User account is disabled', status: 403 };
    }

    console.log('✅ Authentication successful for user:', session.user.email);
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        isActive: session.user.isActive
      },
      status: 200
    };
  } catch (error) {
    console.error('❌ Authentication error:', error);
    return { error: 'Authentication failed', status: 500 };
  }
}

export function requirePermission(user: any, resource: string, action: string): boolean {
  // Basic permission logic
  return true; // Allow all for now
}