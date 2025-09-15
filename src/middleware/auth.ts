// src/middleware/auth.ts
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users, sessions } from '@/lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { verifyAuthToken } from '@/lib/auth-utils';

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

    const user = await verifyAuthToken(token);

    if (!user) {
      return { error: 'Invalid token', status: 401 };
    }
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: true
      },
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
    [action: string]: string[];
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
  user: AuthenticatedUser,
  resource: keyof Permissions,
  action: keyof Permissions[typeof resource]
): boolean {
  return (
    user && PERMISSIONS[resource] && PERMISSIONS[resource][action]?.includes(user.role)
  );
}