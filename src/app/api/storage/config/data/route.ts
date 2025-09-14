import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dataPoints } from '@/lib/db/schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { authenticateRequest, requirePermission } from '@/middleware/auth';

// GET /api/data/points - Query data points with filters
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!requirePermission(authResult.user, 'data_points', 'read')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get('sourceId');
    const tagName = searchParams.get('tagName');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const limit = parseInt(searchParams.get('limit') || '1000');

    // Build query conditions
    const conditions = [];
    
    if (sourceId) {
      conditions.push(eq(dataPoints.sourceId, parseInt(sourceId)));
    }
    
    if (tagName) {
      conditions.push(eq(dataPoints.tagName, tagName));
    }
    
    if (startTime) {
      conditions.push(gte(dataPoints.timestamp, new Date(startTime)));
    }
    
    if (endTime) {
      conditions.push(lte(dataPoints.timestamp, new Date(endTime)));
    }

    const points = await db.query.dataPoints.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: desc(dataPoints.timestamp),
      limit: limit,
    });

    return NextResponse.json({ data: points });
  } catch (error) {
    console.error('Error fetching data points:', error);
    return NextResponse.json({ error: 'Failed to fetch data points' }, { status: 500 });
  }
}

// POST /api/data/points - Ingest new data points
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!requirePermission(authResult.user, 'data_points', 'create')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    // Handle single point or array of points
    const points = Array.isArray(body) ? body : [body];
    
    const insertedPoints = await db.insert(dataPoints).values(
      points.map(point => ({
        sourceId: point.sourceId,
        tagName: point.tagName,
        value: point.value,
        quality: point.quality || 0,
        timestamp: point.timestamp ? new Date(point.timestamp) : new Date(),
        location: point.location,
        metadata: point.metadata,
      }))
    ).returning();

    return NextResponse.json({ data: insertedPoints }, { status: 201 });
  } catch (error) {
    console.error('Error ingesting data points:', error);
    return NextResponse.json({ error: 'Failed to ingest data points' }, { status: 500 });
  }
}