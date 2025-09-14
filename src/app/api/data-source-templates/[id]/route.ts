// app/api/data-source-templates/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dataSourceTemplates } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest, requirePermission } from '@/middleware/auth';
import { InterfaceType, ProtocolType, DataSourceType } from '@/lib/data-sources/types';

// GET /api/data-source-templates/[id] - Get a specific template
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
    const template = await db.query.dataSourceTemplates.findFirst({
      where: eq(dataSourceTemplates.id, params.id),
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Transform with proper type casting
    const typedTemplate = {
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
    };

    return NextResponse.json({ data: typedTemplate });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

// PUT /api/data-source-templates/[id] - Update a template
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

    // Check if template exists
    const existingTemplate = await db.query.dataSourceTemplates.findFirst({
      where: eq(dataSourceTemplates.id, params.id),
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Prevent editing system templates
    if (existingTemplate.isSystem && !authResult.user.role.includes('ADMIN')) {
      return NextResponse.json({ error: 'Cannot modify system templates' }, { status: 403 });
    }

    const updatedTemplate = await db.update(dataSourceTemplates)
      .set({
        name: body.name || existingTemplate.name,
        description: body.description !== undefined ? body.description : existingTemplate.description,
        manufacturer: body.manufacturer !== undefined ? body.manufacturer : existingTemplate.manufacturer,
        model: body.model !== undefined ? body.model : existingTemplate.model,
        type: body.type || existingTemplate.type,
        supportedInterfaces: body.supportedInterfaces || existingTemplate.supportedInterfaces,
        supportedProtocols: body.supportedProtocols || existingTemplate.supportedProtocols,
        defaultConfig: body.defaultConfig || existingTemplate.defaultConfig,
        documentation: body.documentation !== undefined ? body.documentation : existingTemplate.documentation,
        icon: body.icon !== undefined ? body.icon : existingTemplate.icon,
        updatedAt: new Date(),
      })
      .where(eq(dataSourceTemplates.id, params.id))
      .returning();

    // Transform with proper type casting
    const typedTemplate = {
      id: updatedTemplate[0].id,
      name: updatedTemplate[0].name,
      description: updatedTemplate[0].description,
      manufacturer: updatedTemplate[0].manufacturer,
      model: updatedTemplate[0].model,
      type: updatedTemplate[0].type as DataSourceType,
      supportedInterfaces: updatedTemplate[0].supportedInterfaces as InterfaceType[],
      supportedProtocols: updatedTemplate[0].supportedProtocols as ProtocolType[],
      defaultConfig: updatedTemplate[0].defaultConfig as Record<string, any>,
      documentation: updatedTemplate[0].documentation,
      icon: updatedTemplate[0].icon,
      isSystem: updatedTemplate[0].isSystem,
      userId: updatedTemplate[0].userId,
      createdAt: updatedTemplate[0].createdAt,
      updatedAt: updatedTemplate[0].updatedAt,
    };

    return NextResponse.json({ data: typedTemplate });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to update template' 
    }, { status: 500 });
  }
}

// DELETE /api/data-source-templates/[id] - Delete a template
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
    // Check if template exists
    const existingTemplate = await db.query.dataSourceTemplates.findFirst({
      where: eq(dataSourceTemplates.id, params.id),
    });

    if (!existingTemplate) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Prevent deleting system templates
    if (existingTemplate.isSystem) {
      return NextResponse.json({ error: 'Cannot delete system templates' }, { status: 403 });
    }

    await db.delete(dataSourceTemplates).where(eq(dataSourceTemplates.id, params.id));

    return NextResponse.json({ 
      message: 'Template deleted successfully',
      deletedId: params.id 
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to delete template' 
    }, { status: 500 });
  }
}
