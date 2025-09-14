// app/api/data-sources/route.ts

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

// GET /api/data-sources - List all data sources
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!authResult.user || !requirePermission(authResult.user, 'data_sources', 'read')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const sources = await db.query.dataSources.findMany({
      orderBy: (dataSources, { desc }) => [desc(dataSources.createdAt)],
    });

    const manager = DataSourceManager.getInstance();
    const activeSources = manager.getActiveSources();

    // Merge database config with runtime status
    const sourcesWithStatus = sources.map(source => {
      const typedSource = convertToDataSourceConfig(source);
      return {
        ...typedSource,
        runtimeStatus: activeSources.find(s => s.id === source.id)?.status || { 
          isRunning: false,
          connectionStatus: 'disconnected' as const,
        },
      };
    });

    return NextResponse.json({ data: sourcesWithStatus });
  } catch (error) {
    console.error('Error fetching data sources:', error);
    return NextResponse.json({ error: 'Failed to fetch data sources' }, { status: 500 });
  }
}

// POST /api/data-sources - Create a new data source
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!authResult.user || !requirePermission(authResult.user, 'data_sources', 'create')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.type || !body.protocol) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, type, protocol' 
      }, { status: 400 });
    }

    const newSource = await db.insert(dataSources).values({
      name: body.name,
      type: body.type,
      protocol: body.protocol,
      config: body.config || {},
      isActive: body.isActive !== false,
      userId: authResult.user.id,
    }).returning();

    // Convert to properly typed DataSourceConfig
    const typedNewSource = convertToDataSourceConfig(newSource[0]);

    // Start the new data source if it's active
    if (typedNewSource.isActive) {
      try {
        const manager = DataSourceManager.getInstance();
        await manager.startSource(typedNewSource);
      } catch (startError) {
        console.error('Failed to start new data source:', startError);
        // Update database to mark as inactive since start failed
        await db.update(dataSources)
          .set({ isActive: false })
          .where(eq(dataSources.id, typedNewSource.id));
        
        typedNewSource.isActive = false;
      }
    }

    return NextResponse.json({ data: typedNewSource }, { status: 201 });
  } catch (error) {
    console.error('Error creating data source:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create data source' 
    }, { status: 500 });
  }
}
