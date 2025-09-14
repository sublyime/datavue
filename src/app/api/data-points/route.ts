import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dataPoints } from '@/lib/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { authenticateRequest } from '@/middleware/auth';

// GET /api/data-points - Get data points for charts
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get('sourceId');
  const limit = parseInt(searchParams.get('limit') || '50');
  const latest = searchParams.get('latest') === 'true';
  const since = searchParams.get('since'); // ISO date string

  if (!sourceId) {
    return NextResponse.json({ error: 'Source ID is required' }, { status: 400 });
  }

  try {
    let conditions = [eq(dataPoints.sourceId, parseInt(sourceId))];
    
    if (since) {
      conditions.push(gte(dataPoints.timestamp, new Date(since)));
    }

    const points = await db.query.dataPoints.findMany({
      where: and(...conditions),
      orderBy: [desc(dataPoints.timestamp)],
      limit: limit,
    });

    // Transform the data to handle JSONB values
    const transformedPoints = points.map(point => ({
      ...point,
      value: typeof point.value === 'object' ? 
        (point.value as any).value || point.value : 
        point.value
    }));

    return NextResponse.json({ data: transformedPoints });
  } catch (error) {
    console.error('Error fetching data points:', error);
    return NextResponse.json({ error: 'Failed to fetch data points' }, { status: 500 });
  }
}
