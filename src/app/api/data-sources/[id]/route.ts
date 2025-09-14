// app/api/data-sources/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dataSources } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest, requirePermission } from '@/middleware/auth';
import { DataSourceManager } from '@/lib/data-sources/manager';
import { 
  DataSourceConfig, 
  InterfaceType, 
  ProtocolType, 
  DataSourceType,
  SerialInterfaceConfig,
  TcpInterfaceConfig,
  UdpInterfaceConfig,
  UsbInterfaceConfig,
  FileInterfaceConfig,
  ModbusRtuProtocolConfig,
  ModbusTcpProtocolConfig,
  OpcUaProtocolConfig,
  MqttProtocolConfig,
  NmeaProtocolConfig,
  HartProtocolConfig,
  AnalogProtocolConfig,
  ApiProtocolConfig
} from '@/lib/data-sources/types';

// Helper function to convert database result to DataSourceConfig with proper type casting
function convertToDataSourceConfig(dbSource: any): DataSourceConfig {
  return {
    id: dbSource.id,
    name: dbSource.name,
    description: dbSource.description || undefined,
    interface: {
      type: dbSource.interfaceType as InterfaceType,
      config: dbSource.interfaceConfig as any, // Cast to 'any' for flexibility
    },
    protocol: {
      type: dbSource.protocolType as ProtocolType,
      config: dbSource.protocolConfig as any, // Cast to 'any' for flexibility
    },
    dataSource: {
      type: dbSource.dataSourceType as DataSourceType,
      templateId: dbSource.templateId || undefined,
      customConfig: (dbSource.customConfig as Record<string, any>) || {},
    },
    isActive: dbSource.isActive,
    userId: dbSource.userId,
    createdAt: dbSource.createdAt,
    updatedAt: dbSource.updatedAt,
  };
}

// Alternative: More specific type casting based on interface/protocol types
function convertToDataSourceConfigWithTyping(dbSource: any): DataSourceConfig {
  // Determine interface config type based on interface type
  let interfaceConfig: any;
  switch (dbSource.interfaceType) {
    case 'SERIAL':
      interfaceConfig = dbSource.interfaceConfig as SerialInterfaceConfig;
      break;
    case 'TCP':
      interfaceConfig = dbSource.interfaceConfig as TcpInterfaceConfig;
      break;
    case 'UDP':
      interfaceConfig = dbSource.interfaceConfig as UdpInterfaceConfig;
      break;
    case 'USB':
      interfaceConfig = dbSource.interfaceConfig as UsbInterfaceConfig;
      break;
    case 'FILE':
      interfaceConfig = dbSource.interfaceConfig as FileInterfaceConfig;
      break;
    default:
      interfaceConfig = dbSource.interfaceConfig as any;
  }

  // Determine protocol config type based on protocol type
  let protocolConfig: any;
  switch (dbSource.protocolType) {
    case 'MODBUS_RTU':
      protocolConfig = dbSource.protocolConfig as ModbusRtuProtocolConfig;
      break;
    case 'MODBUS_TCP':
      protocolConfig = dbSource.protocolConfig as ModbusTcpProtocolConfig;
      break;
    case 'OPC_UA':
      protocolConfig = dbSource.protocolConfig as OpcUaProtocolConfig;
      break;
    case 'MQTT':
      protocolConfig = dbSource.protocolConfig as MqttProtocolConfig;
      break;
    case 'NMEA_0183':
      protocolConfig = dbSource.protocolConfig as NmeaProtocolConfig;
      break;
    case 'HART':
      protocolConfig = dbSource.protocolConfig as HartProtocolConfig;
      break;
    case 'ANALOG_4_20MA':
    case 'ANALOG_0_5V':
      protocolConfig = dbSource.protocolConfig as AnalogProtocolConfig;
      break;
    case 'API_REST':
    case 'API_SOAP':
      protocolConfig = dbSource.protocolConfig as ApiProtocolConfig;
      break;
    default:
      protocolConfig = dbSource.protocolConfig as any;
  }

  return {
    id: dbSource.id,
    name: dbSource.name,
    description: dbSource.description ?? undefined,
    interface: {
      type: dbSource.interfaceType as InterfaceType,
      config: interfaceConfig,
    },
    protocol: {
      type: dbSource.protocolType as ProtocolType,
      config: protocolConfig,
    },
    dataSource: {
      type: dbSource.dataSourceType as DataSourceType,
      templateId: dbSource.templateId ?? undefined,
      customConfig: (dbSource.customConfig as Record<string, any>) ?? {},
    },
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

    // Update with new structure - handle potentially undefined values properly
    const updatedSource = await db.update(dataSources)
      .set({
        name: body.name ?? existingSource.name,
        description: body.description !== undefined ? (body.description || null) : existingSource.description,
        interfaceType: body.interface?.type ?? existingSource.interfaceType,
        interfaceConfig: body.interface?.config ?? existingSource.interfaceConfig,
        protocolType: body.protocol?.type ?? existingSource.protocolType,
        protocolConfig: body.protocol?.config ?? existingSource.protocolConfig,
        dataSourceType: body.dataSource?.type ?? existingSource.dataSourceType,
        templateId: body.dataSource?.templateId !== undefined ? (body.dataSource.templateId || null) : existingSource.templateId,
        customConfig: body.dataSource?.customConfig ?? existingSource.customConfig,
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
    } else if (body.isActive === false && existingSource.isActive) {
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
