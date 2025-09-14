import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest, requirePermission } from '@/middleware/auth';

// Simple password hashing function (same as above)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// GET /api/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  // Users can read their own profile, admins can read any profile
  // Check if user is defined before accessing properties
  if (!authResult.user || (authResult.user.id !== parseInt(params.id) && !requirePermission(authResult.user, 'users', 'read'))) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(params.id)),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  // Users can update their own profile, admins can update any profile
  // Check if user is defined before accessing properties
  if (!authResult.user || (authResult.user.id !== parseInt(params.id) && !requirePermission(authResult.user, 'users', 'update'))) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    const updateData: any = {
      name: body.name,
      role: body.role,
      permissions: body.permissions,
      updatedAt: new Date(),
    };

    // Only update password if provided
    if (body.password) {
      updateData.password = await hashPassword(body.password);
    }

    const updatedUser = await db.update(users)
      .set(updateData)
      .where(eq(users.id, parseInt(params.id)))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        permissions: users.permissions,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updatedUser[0] });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  // Check if user is defined before accessing properties
  if (!authResult.user || !requirePermission(authResult.user, 'users', 'delete')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const deletedUser = await db.delete(users)
      .where(eq(users.id, parseInt(params.id)))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      });

    if (deletedUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}