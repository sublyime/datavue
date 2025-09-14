import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { storageConfigs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest, requirePermission } from '@/middleware/auth';

// GET /api/storage/config - List all storage configurations
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  // Check if user is defined before accessing properties
  if (!authResult.user || !requirePermission(authResult.user, 'storage', 'read')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const configs = await db.query.storageConfigs.findMany({
      where: eq(storageConfigs.userId, authResult.user.id),
    });

    return NextResponse.json({ data: configs });
  } catch (error) {
    console.error('Error fetching storage configs:', error);
    return NextResponse.json({ error: 'Failed to fetch storage configurations' }, { status: 500 });
  }
}

// POST /api/storage/config - Create a new storage configuration
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  // Check if user is defined before accessing properties
  if (!authResult.user || !requirePermission(authResult.user, 'storage', 'create')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    const newConfig = await db.insert(storageConfigs).values({
      name: body.name,
      type: body.type,
      config: body.config,
      isDefault: body.isDefault || false,
      userId: authResult.user.id,
    }).returning();

    return NextResponse.json({ data: newConfig[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating storage config:', error);
    return NextResponse.json({ error: 'Failed to create storage configuration' }, { status: 500 });
  }
}