// app/api/data-sources/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dataSources } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest, requirePermission } from '@/middleware/auth';
import { DataSourceManager } from '@/lib/data-sources/manager';

// GET /api/data-sources/[id] - Get a specific data source
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

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

    const manager = DataSourceManager.getInstance();
    const activeSources = manager.getActiveSources();
    const runtimeStatus = activeSources.find(s => s.id === source.id)?.status || { isRunning: false };

    return NextResponse.json({ data: { ...source, runtimeStatus } });
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

  if (!authResult.user || !requirePermission(authResult.user, 'data_sources', 'update')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const sourceId = parseInt(params.id);
    
    const updatedSource = await db.update(dataSources)
      .set({
        name: body.name,
        type: body.type,
        protocol: body.protocol,
        config: body.config,
        isActive: body.isActive,
        updatedAt: new Date(),
      })
      .where(eq(dataSources.id, sourceId))
      .returning();

    if (updatedSource.length === 0) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    const manager = DataSourceManager.getInstance();
    
    // Restart the source if it was active and configuration changed
    if (body.isActive) {
      await manager.restartSource(sourceId);
    } else {
      await manager.stopSource(sourceId);
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

  if (!authResult.user || !requirePermission(authResult.user, 'data_sources', 'delete')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const sourceId = parseInt(params.id);
    
    // Stop the source first
    const manager = DataSourceManager.getInstance();
    await manager.stopSource(sourceId);

    const deletedSource = await db.delete(dataSources)
      .where(eq(dataSources.id, sourceId))
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