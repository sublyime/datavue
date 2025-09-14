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
    const token = request.cookies.get('session-token')?.value;
    
    if (!token) {
      return { error: 'No authentication token', status: 401 };
    }

    // Check session in database
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.token, token),
      columns: {
        id: true,
        userId: true,
        token: true,
        expiresAt: true,
        createdAt: true
      },
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

    if (!session || !session.user) {
      return { error: 'Invalid session', status: 401 };
    }

    if (new Date(session.expiresAt) < new Date()) {
      return { error: 'Session expired', status: 401 };
    }

    if (!session.user.isActive) {
      return { error: 'User account is disabled', status: 403 };
    }

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
    console.error('Authentication error:', error);
    return { error: 'Authentication failed', status: 500 };
  }
}

export function requirePermission(user: any, resource: string, action: string): boolean {
  if (user.role === 'ADMIN') {
    return true;
  }

  const rolePermissions: Record<string, string[]> = {
    ADMIN: ['create', 'read', 'update', 'delete'],
    OPERATOR: ['create', 'read', 'update'],
    USER: ['read', 'update'],
    VIEWER: ['read']
  };

  return rolePermissions[user.role]?.includes(action) || false;
}