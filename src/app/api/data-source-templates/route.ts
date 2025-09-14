// app/api/data-source-templates/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dataSourceTemplates } from '@/lib/db/schema';
import { authenticateRequest, requirePermission } from '@/middleware/auth';
import { InterfaceType, ProtocolType, DataSourceType } from '@/lib/data-sources/types';

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!authResult.user || !requirePermission(authResult.user, 'data_sources', 'read')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const interfaceType = searchParams.get('interface');
    const protocolType = searchParams.get('protocol');
    const dataSourceType = searchParams.get('type');

    const templates = await db.query.dataSourceTemplates.findMany({
      orderBy: (dataSourceTemplates, { asc }) => [asc(dataSourceTemplates.name)],
    });

    // Filter based on query parameters with proper type casting
    let filteredTemplates = templates;

    if (interfaceType) {
      filteredTemplates = filteredTemplates.filter(t => {
        const supportedInterfaces = t.supportedInterfaces as string[];
        return Array.isArray(supportedInterfaces) && supportedInterfaces.includes(interfaceType);
      });
    }

    if (protocolType) {
      filteredTemplates = filteredTemplates.filter(t => {
        const supportedProtocols = t.supportedProtocols as string[];
        return Array.isArray(supportedProtocols) && supportedProtocols.includes(protocolType);
      });
    }

    if (dataSourceType) {
      filteredTemplates = filteredTemplates.filter(t => 
        t.type === dataSourceType
      );
    }

    // Transform the data to ensure proper typing
    const typedTemplates = filteredTemplates.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      manufacturer: template.manufacturer,
      model: template.model,
      type: template.type as DataSourceType,
      supportedInterfaces: template.supportedInterfaces as InterfaceType[],
      supportedProtocols: template.supportedProtocols as ProtocolType[],
      defaultConfig: template.defaultConfig as Record<string, any>,
      documentation: template.documentation,
      icon: template.icon,
      isSystem: template.isSystem,
      userId: template.userId,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    }));

    return NextResponse.json({ 
      data: typedTemplates,
      count: typedTemplates.length,
      filters: {
        interface: interfaceType,
        protocol: protocolType,
        type: dataSourceType,
      }
    });
  } catch (error) {
    console.error('Error fetching data source templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

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
    if (!body.id || !body.name || !body.type || !body.supportedInterfaces || !body.supportedProtocols) {
      return NextResponse.json({ 
        error: 'Missing required fields: id, name, type, supportedInterfaces, supportedProtocols' 
      }, { status: 400 });
    }

    // Validate array fields
    if (!Array.isArray(body.supportedInterfaces) || !Array.isArray(body.supportedProtocols)) {
      return NextResponse.json({ 
        error: 'supportedInterfaces and supportedProtocols must be arrays' 
      }, { status: 400 });
    }

    // Validate interface types
    const validInterfaceTypes: InterfaceType[] = ['SERIAL', 'TCP', 'UDP', 'USB', 'FILE'];
    const invalidInterfaces = body.supportedInterfaces.filter((iface: string) => 
      !validInterfaceTypes.includes(iface as InterfaceType)
    );
    
    if (invalidInterfaces.length > 0) {
      return NextResponse.json({ 
        error: `Invalid interface types: ${invalidInterfaces.join(', ')}. Valid types: ${validInterfaceTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Validate protocol types
    const validProtocolTypes: ProtocolType[] = [
      'MODBUS_RTU', 'MODBUS_TCP', 'OPC_UA', 'OSI_PI', 'MQTT', 'NMEA_0183', 
      'HART', 'ANALOG_4_20MA', 'ANALOG_0_5V', 'API_REST', 'API_SOAP'
    ];
    const invalidProtocols = body.supportedProtocols.filter((protocol: string) => 
      !validProtocolTypes.includes(protocol as ProtocolType)
    );
    
    if (invalidProtocols.length > 0) {
      return NextResponse.json({ 
        error: `Invalid protocol types: ${invalidProtocols.join(', ')}. Valid types: ${validProtocolTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Check if template ID already exists
    const existingTemplate = await db.query.dataSourceTemplates.findFirst({
      where: (dataSourceTemplates, { eq }) => eq(dataSourceTemplates.id, body.id),
    });

    if (existingTemplate) {
      return NextResponse.json({ 
        error: `Template with ID '${body.id}' already exists` 
      }, { status: 409 });
    }

    const newTemplate = await db.insert(dataSourceTemplates).values({
      id: body.id,
      name: body.name,
      description: body.description || null,
      manufacturer: body.manufacturer || null,
      model: body.model || null,
      type: body.type,
      supportedInterfaces: body.supportedInterfaces,
      supportedProtocols: body.supportedProtocols,
      defaultConfig: body.defaultConfig || {},
      documentation: body.documentation || null,
      icon: body.icon || null,
      isSystem: false, // User-created templates are not system templates
      userId: authResult.user.id,
    }).returning();

    // Transform the response to ensure proper typing
    const typedTemplate = {
      id: newTemplate[0].id,
      name: newTemplate[0].name,
      description: newTemplate[0].description,
      manufacturer: newTemplate[0].manufacturer,
      model: newTemplate[0].model,
      type: newTemplate[0].type as DataSourceType,
      supportedInterfaces: newTemplate[0].supportedInterfaces as InterfaceType[],
      supportedProtocols: newTemplate[0].supportedProtocols as ProtocolType[],
      defaultConfig: newTemplate[0].defaultConfig as Record<string, any>,
      documentation: newTemplate[0].documentation,
      icon: newTemplate[0].icon,
      isSystem: newTemplate[0].isSystem,
      userId: newTemplate[0].userId,
      createdAt: newTemplate[0].createdAt,
      updatedAt: newTemplate[0].updatedAt,
    };

    return NextResponse.json({ data: typedTemplate }, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to create template' 
    }, { status: 500 });
  }
}
