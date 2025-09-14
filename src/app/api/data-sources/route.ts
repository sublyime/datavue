import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dataSources } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest, requirePermission } from '@/middleware/auth';

// GET /api/data-sources - List all data sources
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  // Check if user is defined before accessing properties
  if (!authResult.user || !requirePermission(authResult.user, 'data_sources', 'read')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const sources = await db.query.dataSources.findMany({
      where: eq(dataSources.isActive, true),
    });

    return NextResponse.json({ data: sources });
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

  // Check if user is defined before accessing properties
  if (!authResult.user || !requirePermission(authResult.user, 'data_sources', 'create')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    const newSource = await db.insert(dataSources).values({
      name: body.name,
      type: body.type,
      protocol: body.protocol,
      config: body.config,
      userId: authResult.user.id,
    }).returning();

    return NextResponse.json({ data: newSource[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating data source:', error);
    return NextResponse.json({ error: 'Failed to create data source' }, { status: 500 });
  }
}