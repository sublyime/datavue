import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dataSources } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/middleware/auth';

// ✅ FIXED: Define interface for the config types
interface InterfaceConfig {
  latitude?: number;
  longitude?: number;
  host?: string;
  port?: number;
  [key: string]: any; // Allow other properties
}

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const sources = await db.query.dataSources.findMany({
      where: eq(dataSources.userId, authResult.user!.id),
      orderBy: (dataSources, { desc }) => [desc(dataSources.createdAt)],
    });

    // ✅ FIXED: Transform data with proper type casting
    const transformedSources = sources.map(source => {
      // Cast interfaceConfig to our defined interface
      const interfaceConfig = source.interfaceConfig as InterfaceConfig;
      
      return {
        id: source.id,
        name: source.name,
        description: source.description,
        interfaceType: source.interfaceType,
        protocolType: source.protocolType,
        dataSourceType: source.dataSourceType,
        isActive: source.isActive,
        // ✅ FIXED: Now TypeScript knows these properties exist
        latitude: interfaceConfig?.latitude || null,
        longitude: interfaceConfig?.longitude || null,
        // Add connection status (you can enhance this with real status checking)
        connectionStatus: source.isActive ? 'connected' : 'disconnected' as const,
        lastUpdated: source.updatedAt,
        createdAt: source.createdAt,
        interfaceConfig: source.interfaceConfig,
        protocolConfig: source.protocolConfig,
        customConfig: source.customConfig
      };
    });

    return NextResponse.json({ data: transformedSources });
  } catch (error) {
    console.error('Error fetching data sources:', error);
    return NextResponse.json({ error: 'Failed to fetch data sources' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await request.json();
    const { name, description, interfaceType, interfaceConfig, protocolType, protocolConfig, dataSourceType, customConfig } = body;

    // ✅ FIXED: Validate required fields
    if (!name || !interfaceType || !protocolType || !dataSourceType) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, interfaceType, protocolType, dataSourceType' 
      }, { status: 400 });
    }

    const newSource = await db.insert(dataSources).values({
      name,
      description,
      interfaceType,
      interfaceConfig: interfaceConfig || {},
      protocolType,
      protocolConfig: protocolConfig || {},
      dataSourceType,
      customConfig: customConfig || {},
      isActive: false,
      userId: authResult.user!.id,
    }).returning();

    return NextResponse.json({ data: newSource[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating data source:', error);
    return NextResponse.json({ error: 'Failed to create data source' }, { status: 500 });
  }
}
