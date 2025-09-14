import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dataPoints } from '@/lib/db/schema';
import { and, gte, lte, eq, sql } from 'drizzle-orm';
import { authenticateRequest, requirePermission } from '@/middleware/auth';

// GET /api/data/points/stats - Get statistics for data points
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

    const stats = await db
      .select({
        count: sql<number>`count(*)`,
        min: sql<number>`min(CAST(value->>'value' as numeric))`,
        max: sql<number>`max(CAST(value->>'value' as numeric))`,
        avg: sql<number>`avg(CAST(value->>'value' as numeric))`,
        firstTimestamp: sql<Date>`min(timestamp)`,
        lastTimestamp: sql<Date>`max(timestamp)`,
      })
      .from(dataPoints)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return NextResponse.json({ data: stats[0] });
  } catch (error) {
    console.error('Error fetching data statistics:', error);
    return NextResponse.json({ error: 'Failed to fetch data statistics' }, { status: 500 });
  }
}