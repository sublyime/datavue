// app/api/data-sources/route.ts

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
      type: dbSource.interfaceType as InterfaceType,
      config: dbSource.interfaceConfig as Record<string, any>,
    },
    protocol: {
      type: dbSource.protocolType as ProtocolType,
      config: dbSource.protocolConfig as Record<string, any>,
    },
    dataSource: {
      type: dbSource.dataSourceType as DataSourceType,
      templateId: dbSource.templateId || undefined,
      customConfig: dbSource.customConfig as Record<string, any> || {},
    },
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
    
    // Validate required fields for new structure
    if (!body.name || !body.interface?.type || !body.protocol?.type || !body.dataSource?.type) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, interface.type, protocol.type, dataSource.type' 
      }, { status: 400 });
    }

    // Validate interface and protocol types
    const validInterfaceTypes = ['SERIAL', 'TCP', 'UDP', 'USB', 'FILE'];
    const validProtocolTypes = ['MODBUS_RTU', 'MODBUS_TCP', 'OPC_UA', 'OSI_PI', 'MQTT', 'NMEA_0183', 'HART', 'ANALOG_4_20MA', 'ANALOG_0_5V', 'API_REST', 'API_SOAP'];
    const validDataSourceTypes = ['PLC', 'HMI', 'SENSOR_NETWORK', 'WEATHER_STATION', 'GPS_TRACKER', 'FLOW_METER', 'TEMPERATURE_SENSOR', 'PRESSURE_TRANSMITTER', 'LEVEL_SENSOR', 'VIBRATION_MONITOR', 'GAS_DETECTOR', 'WATER_QUALITY_SENSOR', 'POWER_METER', 'HISTORIAN_SERVER', 'SCADA_SYSTEM', 'CUSTOM'];

    if (!validInterfaceTypes.includes(body.interface.type)) {
      return NextResponse.json({ 
        error: `Invalid interface type. Must be one of: ${validInterfaceTypes.join(', ')}` 
      }, { status: 400 });
    }

    if (!validProtocolTypes.includes(body.protocol.type)) {
      return NextResponse.json({ 
        error: `Invalid protocol type. Must be one of: ${validProtocolTypes.join(', ')}` 
      }, { status: 400 });
    }

    if (!validDataSourceTypes.includes(body.dataSource.type)) {
      return NextResponse.json({ 
        error: `Invalid data source type. Must be one of: ${validDataSourceTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Create the new data source with correct field mapping
    const newSource = await db.insert(dataSources).values({
      name: body.name,
      description: body.description || null,
      interfaceType: body.interface.type,
      interfaceConfig: body.interface.config || {},
      protocolType: body.protocol.type,
      protocolConfig: body.protocol.config || {},
      dataSourceType: body.dataSource.type,
      templateId: body.dataSource.templateId || null,
      customConfig: body.dataSource.customConfig || {},
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
        
        return NextResponse.json({ 
          data: typedNewSource,
          warning: `Data source created but failed to start: ${startError instanceof Error ? startError.message : 'Unknown error'}`
        }, { status: 201 });
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
