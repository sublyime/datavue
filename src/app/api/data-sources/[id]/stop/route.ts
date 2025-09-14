import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dataSources } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest, requirePermission } from '@/middleware/auth';
import { DataSourceManager } from '@/lib/data-sources/manager';

// POST /api/data-sources/[id]/stop - Stop a data source
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!authResult.user || !requirePermission(authResult.user, 'data_sources', 'update')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const { id } = await params; // Await params for Next.js 15
    const sourceId = parseInt(id);
    
    if (isNaN(sourceId)) {
      return NextResponse.json({ error: 'Invalid data source ID' }, { status: 400 });
    }

    const manager = DataSourceManager.getInstance();
    
    try {
      await manager.stopSource(sourceId);

      // Update database to mark as inactive
      await db.update(dataSources)
        .set({ isActive: false })
        .where(eq(dataSources.id, sourceId));

      return NextResponse.json({ 
        message: 'Data source stopped successfully',
        id: sourceId 
      });
    } catch (stopError) {
      console.error('Error stopping data source:', stopError);
      return NextResponse.json({ 
        error: stopError instanceof Error ? stopError.message : 'Failed to stop data source' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in stop route:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
