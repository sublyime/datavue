
// src/middleware/auth.ts
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users, sessions } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

export interface AuthResult {
  user?: AuthenticatedUser;
  error?: string;
  status: number;
}

export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    const token = request.cookies.get('session-token')?.value;
    
    if (!token) {
      return { error: 'No session token', status: 401 };
    }

    // Find the session and join with user
    const sessionResult = await db
      .select({
        userId: sessions.userId,
        expiresAt: sessions.expiresAt,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          isActive: users.isActive,
        }
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.token, token),
          gt(sessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (sessionResult.length === 0) {
      return { error: 'Invalid or expired session', status: 401 };
    }

    const session = sessionResult[0];

    if (!session.user.isActive) {
      return { error: 'Account disabled', status: 403 };
    }

    return {
      user: session.user,
      status: 200
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return { error: 'Authentication failed', status: 500 };
  }
}

// Permission system
export interface Permissions {
  [resource: string]: {
    [action: string]: string[]; // roles that have this permission
  };
}

const PERMISSIONS: Permissions = {
  data_sources: {
    create: ['ADMIN', 'ENGINEER'],
    read: ['ADMIN', 'ENGINEER', 'OPERATOR', 'VIEWER'],
    update: ['ADMIN', 'ENGINEER'],
    delete: ['ADMIN'],
  },
  data_points: {
    create: ['ADMIN', 'ENGINEER', 'OPERATOR'],
    read: ['ADMIN', 'ENGINEER', 'OPERATOR', 'VIEWER'],
    update: ['ADMIN', 'ENGINEER'],
    delete: ['ADMIN'],
  },
  users: {
    create: ['ADMIN'],
    read: ['ADMIN'],
    update: ['ADMIN'],
    delete: ['ADMIN'],
  },
  storage: {
    create: ['ADMIN', 'ENGINEER'],
    read: ['ADMIN', 'ENGINEER', 'OPERATOR', 'VIEWER'],
    update: ['ADMIN', 'ENGINEER'],
    delete: ['ADMIN'],
  },
  protocols: {
    translate: ['ADMIN', 'ENGINEER'],
    scan: ['ADMIN', 'ENGINEER'],
  },
};

export function requirePermission(
  user: AuthenticatedUser | undefined, 
  resource: string, 
  action: string
): boolean {
  if (!user) return false;
  
  const resourcePermissions = PERMISSIONS[resource];
  if (!resourcePermissions) return false;
  
  const actionPermissions = resourcePermissions[action];
  if (!actionPermissions) return false;
  
  return actionPermissions.includes(user.role);
}
