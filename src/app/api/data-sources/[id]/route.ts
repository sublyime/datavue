import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dataSources } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest, requirePermission } from '@/middleware/auth';

// GET /api/data-sources/[id] - Get a specific data source
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  // Check if user is defined before accessing properties
  if (!authResult.user || !requirePermission(authResult.user, 'data_sources', 'read')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const source = await db.query.dataSources.findFirst({
      where: eq(dataSources.id, parseInt(params.id)),
    });

    if (!source) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    return NextResponse.json({ data: source });
  } catch (error) {
    console.error('Error fetching data source:', error);
    return NextResponse.json({ error: 'Failed to fetch data source' }, { status: 500 });
  }
}

// PUT /api/data-sources/[id] - Update a data source
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  // Check if user is defined before accessing properties
  if (!authResult.user || !requirePermission(authResult.user, 'data_sources', 'update')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    const updatedSource = await db.update(dataSources)
      .set({
        name: body.name,
        type: body.type,
        protocol: body.protocol,
        config: body.config,
        isActive: body.isActive,
        updatedAt: new Date(),
      })
      .where(eq(dataSources.id, parseInt(params.id)))
      .returning();

    if (updatedSource.length === 0) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updatedSource[0] });
  } catch (error) {
    console.error('Error updating data source:', error);
    return NextResponse.json({ error: 'Failed to update data source' }, { status: 500 });
  }
}

// DELETE /api/data-sources/[id] - Delete a data source
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  // Check if user is defined before accessing properties
  if (!authResult.user || !requirePermission(authResult.user, 'data_sources', 'delete')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const deletedSource = await db.delete(dataSources)
      .where(eq(dataSources.id, parseInt(params.id)))
      .returning();

    if (deletedSource.length === 0) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Data source deleted successfully' });
  } catch (error) {
    console.error('Error deleting data source:', error);
    return NextResponse.json({ error: 'Failed to delete data source' }, { status: 500 });
  }
}