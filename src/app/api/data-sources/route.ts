// app/api/data-sources/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dataSources } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest, requirePermission } from '@/middleware/auth';
import { DataSourceManager } from '@/lib/data-sources/manager';

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
    const sourcesWithStatus = sources.map(source => ({
      ...source,
      runtimeStatus: activeSources.find(s => s.id === source.id)?.status || { isRunning: false },
    }));

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
    
    const newSource = await db.insert(dataSources).values({
      name: body.name,
      type: body.type,
      protocol: body.protocol,
      config: body.config || {},
      isActive: body.isActive !== false,
      userId: authResult.user.id,
    }).returning();

    // Start the new data source if it's active
    if (newSource[0].isActive) {
      const manager = DataSourceManager.getInstance();
      await manager.startSource(newSource[0]);
    }

    return NextResponse.json({ data: newSource[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating data source:', error);
    return NextResponse.json({ error: 'Failed to create data source' }, { status: 500 });
  }
}