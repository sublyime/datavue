import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dataPoints, dataSources } from '@/lib/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { authenticateRequest } from '@/middleware/auth';

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get('sourceId');
  const limit = parseInt(searchParams.get('limit') || '50');
  const since = searchParams.get('since');
  const until = searchParams.get('until');

  try {
    if (sourceId) {
      // Fetch data points for a specific source
      const sourceIdInt = parseInt(sourceId);
      
      // Verify user owns this data source
      const source = await db.query.dataSources.findFirst({
        where: and(
          eq(dataSources.id, sourceIdInt),
          eq(dataSources.userId, authResult.user!.id)
        ),
      });

      if (!source) {
        return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
      }

      let conditions = [eq(dataPoints.sourceId, sourceIdInt)];
      
      if (since) {
        conditions.push(gte(dataPoints.timestamp, new Date(since)));
      }
      
      if (until) {
        conditions.push(lte(dataPoints.timestamp, new Date(until)));
      }

      const points = await db.query.dataPoints.findMany({
        where: and(...conditions),
        orderBy: [desc(dataPoints.timestamp)],
        limit: limit,
      });

      return NextResponse.json({ data: points });
    } else {
      // Fetch all data points for user's sources
      const userSources = await db.query.dataSources.findMany({
        where: eq(dataSources.userId, authResult.user!.id),
        columns: { id: true }
      });

      if (userSources.length === 0) {
        return NextResponse.json({ data: [] });
      }

      const sourceIds = userSources.map(s => s.id);
      
      const points = await db.query.dataPoints.findMany({
        where: and(...sourceIds.map(id => eq(dataPoints.sourceId, id))),
        orderBy: [desc(dataPoints.timestamp)],
        limit: limit,
        with: {
          dataSource: {
            columns: { name: true }
          }
        }
      });

      return NextResponse.json({ data: points });
    }
  } catch (error) {
    console.error('Error fetching data points:', error);
    return NextResponse.json({ error: 'Failed to fetch data points' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await request.json();
    const { sourceId, tagName, value, quality, location, metadata } = body;

    // Verify user owns this data source
    const source = await db.query.dataSources.findFirst({
      where: and(
        eq(dataSources.id, sourceId),
        eq(dataSources.userId, authResult.user!.id)
      ),
    });

    if (!source) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    const newDataPoint = await db.insert(dataPoints).values({
      sourceId,
      tagName,
      value: typeof value === 'object' ? value : { value },
      quality: quality || 192,
      location,
      metadata,
      timestamp: new Date(),
    }).returning();

    return NextResponse.json({ data: newDataPoint[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating data point:', error);
    return NextResponse.json({ error: 'Failed to create data point' }, { status: 500 });
  }
}
