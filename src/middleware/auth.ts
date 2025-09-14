import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sessions, users } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: string;
  permissions: Record<string, string[]>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  user?: AuthenticatedUser;
  error?: string;
  status?: number;
}

// Interface for the user object returned by Drizzle query
interface DatabaseUser {
  id: number;
  email: string;
  name: string;
  role: string;
  permissions: Record<string, string[]>;
  createdAt: Date;
  updatedAt: Date;
  password: string; // This field exists but we'll exclude it
}

export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized', status: 401 };
  }

  const token = authHeader.substring(7);
  
  try {
    const session = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.token, token),
        gt(sessions.expiresAt, new Date())
      ),
      with: {
        user: true
      }
    });

    if (!session || !session.user) {
      return { error: 'Invalid or expired token', status: 401 };
    }

    // Type assertion to ensure TypeScript knows the structure
    const dbUser = session.user as DatabaseUser;

    // Return user without password field - manually create a new object
    const userWithoutPassword: AuthenticatedUser = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      permissions: dbUser.permissions,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt
    };

    return { user: userWithoutPassword };
  } catch (error) {
    console.error('Authentication error:', error);
    return { error: 'Authentication failed', status: 500 };
  }
}

export function requirePermission(user: AuthenticatedUser, resource: string, action: string): boolean {
  // Check if user has admin role
  if (user.role === 'admin') {
    return true;
  }

  // Check user-specific permissions
  if (user.permissions && user.permissions[resource] && user.permissions[resource].includes(action)) {
    return true;
  }

  return false;
}