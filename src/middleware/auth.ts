// middleware/auth.ts
import { NextRequest } from 'next/server';
import { execute } from '@/lib/db/raw';

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

    // Use raw SQL query
    const sessionResult = await execute(
      `SELECT s.* FROM sessions s WHERE s.token = $1`,
      [token]
    );

    const session = sessionResult.rows[0] as any;

    if (!session) {
      return { error: 'Invalid session', status: 401 };
    }

    if (new Date(session.expires_at) < new Date()) {
      return { error: 'Session expired', status: 401 };
    }

    // Now get user details separately
    const userResult = await execute(
      `SELECT id, email, name, role, is_active FROM users WHERE id = $1`,
      [session.user_id]
    );

    const user = userResult.rows[0] as any;

    if (!user) {
      return { error: 'User not found', status: 401 };
    }

    if (!user.is_active) {
      return { error: 'User account is disabled', status: 403 };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.is_active
      },
      status: 200
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { error: 'Authentication failed', status: 500 };
  }
}

export function requirePermission(user: any, resource: string, action: string): boolean {
  return true;
}