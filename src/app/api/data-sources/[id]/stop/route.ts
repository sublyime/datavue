// app/api/data-sources/[id]/stop/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dataSources } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest, requirePermission } from '@/middleware/auth';
import { DataSourceManager } from '@/lib/data-sources/manager';

export async function POST(
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
    const sourceId = parseInt(params.id);
    
    const manager = DataSourceManager.getInstance();
    await manager.stopSource(sourceId);

    // Update the database to mark as inactive
    await db.update(dataSources)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(dataSources.id, sourceId));

    return NextResponse.json({ message: 'Data source stopped successfully' });
  } catch (error) {
    console.error('Error stopping data source:', error);
    return NextResponse.json({ error: 'Failed to stop data source' }, { status: 500 });
  }
}