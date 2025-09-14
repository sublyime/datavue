// app/api/data-sources/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dataSources } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest, requirePermission } from '@/middleware/auth';
import { DataSourceManager } from '@/lib/data-sources/manager';
import { DataSourceConfig, DataSourceType, ProtocolType } from '@/lib/data-sources/types';

// Helper function to convert database result to DataSourceConfig
function convertToDataSourceConfig(dbSource: any): DataSourceConfig {
  return {
    id: dbSource.id,
    name: dbSource.name,
    type: dbSource.type as DataSourceType,
    protocol: dbSource.protocol as ProtocolType,
    config: dbSource.config as Record<string, any>,
    isActive: dbSource.isActive,
    userId: dbSource.userId,
    createdAt: dbSource.createdAt,
    updatedAt: dbSource.updatedAt,
  };
}

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
    const sourceId = parseInt(params.id);
    if (isNaN(sourceId)) {
      return NextResponse.json({ error: 'Invalid data source ID' }, { status: 400 });
    }

    const source = await db.query.dataSources.findFirst({
      where: eq(dataSources.id, sourceId),
    });

    if (!source) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    // Convert to properly typed DataSourceConfig
    const typedSource = convertToDataSourceConfig(source);

    const manager = DataSourceManager.getInstance();
    const activeSources = manager.getActiveSources();
    const runtimeStatus = activeSources.find(s => s.id === typedSource.id)?.status || { 
      isRunning: false,
      connectionStatus: 'disconnected' as const,
    };

    return NextResponse.json({ 
      data: { 
        ...typedSource, 
        runtimeStatus 
      } 
    });
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
    
    if (isNaN(sourceId)) {
      return NextResponse.json({ error: 'Invalid data source ID' }, { status: 400 });
    }

    // Check if data source exists
    const existingSource = await db.query.dataSources.findFirst({
      where: eq(dataSources.id, sourceId),
    });

    if (!existingSource) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    const updatedSource = await db.update(dataSources)
      .set({
        name: body.name || existingSource.name,
        type: body.type || existingSource.type,
        protocol: body.protocol || existingSource.protocol,
        config: body.config || existingSource.config,
        isActive: body.isActive !== undefined ? body.isActive : existingSource.isActive,
        updatedAt: new Date(),
      })
      .where(eq(dataSources.id, sourceId))
      .returning();

    // Convert to properly typed DataSourceConfig
    const typedUpdatedSource = convertToDataSourceConfig(updatedSource[0]);

    const manager = DataSourceManager.getInstance();
    
    // Handle source state changes
    if (body.isActive && !existingSource.isActive) {
      // Starting the source
      try {
        await manager.startSource(typedUpdatedSource);
      } catch (startError) {
        console.error('Failed to start updated data source:', startError);
        // Revert isActive to false
        await db.update(dataSources)
          .set({ isActive: false })
          .where(eq(dataSources.id, sourceId));
        typedUpdatedSource.isActive = false;
      }
    } else if (!body.isActive && existingSource.isActive) {
      // Stopping the source
      try {
        await manager.stopSource(sourceId);
      } catch (stopError) {
        console.error('Failed to stop data source:', stopError);
      }
    } else if (body.isActive && existingSource.isActive) {
      // Restarting the source with new configuration
      try {
        await manager.restartSource(sourceId);
      } catch (restartError) {
        console.error('Failed to restart data source:', restartError);
      }
    }

    return NextResponse.json({ data: typedUpdatedSource });
  } catch (error) {
    console.error('Error updating data source:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to update data source' 
    }, { status: 500 });
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
    
    if (isNaN(sourceId)) {
      return NextResponse.json({ error: 'Invalid data source ID' }, { status: 400 });
    }

    // Check if data source exists
    const existingSource = await db.query.dataSources.findFirst({
      where: eq(dataSources.id, sourceId),
    });

    if (!existingSource) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    // Stop and remove the source
    const manager = DataSourceManager.getInstance();
    try {
      await manager.removeSource(sourceId);
    } catch (removeError) {
      console.error('Failed to remove data source from manager:', removeError);
    }

    return NextResponse.json({ 
      message: 'Data source deleted successfully',
      deletedId: sourceId 
    });
  } catch (error) {
    console.error('Error deleting data source:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to delete data source' 
    }, { status: 500 });
  }
}
