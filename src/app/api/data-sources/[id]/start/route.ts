import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dataSources } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest, requirePermission } from '@/middleware/auth';
import { DataSourceManager } from '@/lib/data-sources/manager';
import { DataSourceConfig, InterfaceType, ProtocolType, DataSourceType } from '@/lib/data-sources/types';

// Helper function to convert database result to DataSourceConfig
function convertToDataSourceConfig(dbSource: any): DataSourceConfig {
  return {
    id: dbSource.id,
    name: dbSource.name,
    description: dbSource.description || undefined,
    interface: {
      type: (dbSource.interfaceType || dbSource.type || 'TCP') as InterfaceType,
      config: (dbSource.interfaceConfig || dbSource.config || {}) as any,
    },
    protocol: {
      type: (dbSource.protocolType || dbSource.protocol || 'API_REST') as ProtocolType,
      config: (dbSource.protocolConfig || dbSource.config || {}) as any,
    },
    dataSource: {
      type: (dbSource.dataSourceType || dbSource.type || 'CUSTOM') as DataSourceType,
      templateId: dbSource.templateId || undefined,
      customConfig: (dbSource.customConfig || {}) as Record<string, any>,
    },
    isActive: dbSource.isActive,
    userId: dbSource.userId,
    createdAt: dbSource.createdAt,
    updatedAt: dbSource.updatedAt,
  };
}

// POST /api/data-sources/[id]/start - Start a data source
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!authResult.user || !requirePermission(authResult.user, 'data_sources', 'update')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const { id } = await params; // Await params for Next.js 15
    const sourceId = parseInt(id);
    
    if (isNaN(sourceId)) {
      return NextResponse.json({ error: 'Invalid data source ID' }, { status: 400 });
    }

    // Get the data source from database
    const dbSource = await db.query.dataSources.findFirst({
      where: eq(dataSources.id, sourceId),
    });

    if (!dbSource) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    // Convert to DataSourceConfig
    const sourceConfig = convertToDataSourceConfig(dbSource);

    console.log(`🚀 Starting data source: ${sourceConfig.name} (ID: ${sourceId})`);

    const manager = DataSourceManager.getInstance();
    
    try {
      await manager.startSource(sourceConfig);

      // Update database to mark as active
      await db.update(dataSources)
        .set({ isActive: true })
        .where(eq(dataSources.id, sourceId));

      return NextResponse.json({ 
        message: 'Data source started successfully',
        id: sourceId 
      });
    } catch (startError) {
      console.error('Error starting data source:', startError);
      return NextResponse.json({ 
        error: startError instanceof Error ? startError.message : 'Failed to start data source' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in start route:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
