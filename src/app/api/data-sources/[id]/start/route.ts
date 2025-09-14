// app/api/data-sources/[id]/start/route.ts

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

export async function POST(
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
    const sourceId = parseInt(params.id);
    
    if (isNaN(sourceId)) {
      return NextResponse.json({ error: 'Invalid data source ID' }, { status: 400 });
    }

    // Get the data source config from database
    const sourceConfig = await db.query.dataSources.findFirst({
      where: eq(dataSources.id, sourceId),
    });

    if (!sourceConfig) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    // Convert to properly typed DataSourceConfig
    const typedSourceConfig = convertToDataSourceConfig(sourceConfig);

    const manager = DataSourceManager.getInstance();
    await manager.startSource(typedSourceConfig);

    // Update the database to mark as active
    await db.update(dataSources)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(dataSources.id, sourceId));

    return NextResponse.json({ message: 'Data source started successfully' });
  } catch (error) {
    console.error('Error starting data source:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to start data source' 
    }, { status: 500 });
  }
}
