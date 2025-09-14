import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dataSources, dataPoints } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';
import { authenticateRequest } from '@/middleware/auth';

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    // Get total sources for this user
    const totalSources = await db
      .select({ count: count() })
      .from(dataSources)
      .where(eq(dataSources.userId, authResult.user!.id));
    
    // Get active sources for this user
    const activeSources = await db
      .select({ count: count() })
      .from(dataSources)
      .where(and(
        eq(dataSources.isActive, true),
        eq(dataSources.userId, authResult.user!.id)
      ));
    
    // Get total data points for this user's sources
    const userSources = await db
      .select({ id: dataSources.id })
      .from(dataSources)
      .where(eq(dataSources.userId, authResult.user!.id));
    
    let totalDataPoints = [{ count: 0 }];
    if (userSources.length > 0) {
      const sourceIds = userSources.map(s => s.id);
      totalDataPoints = await db
        .select({ count: count() })
        .from(dataPoints)
        .where(inArray(dataPoints.sourceId, sourceIds));
    }
    
    // For connected sources, we'll use the same as active for now
    // In a real implementation, you'd check the DataSourceManager status
    const connectedSources = activeSources;

    return NextResponse.json({
      data: {
        totalSources: totalSources[0]?.count || 0,
        activeSources: activeSources[0]?.count || 0,
        connectedSources: connectedSources[0]?.count || 0,
        totalDataPoints: totalDataPoints[0]?.count || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
