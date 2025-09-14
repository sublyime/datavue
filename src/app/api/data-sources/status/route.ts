// app/api/data-sources/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, requirePermission } from '@/middleware/auth';
import { DataSourceManager } from '@/lib/data-sources/manager';

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!authResult.user || !requirePermission(authResult.user, 'data_sources', 'read')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const manager = DataSourceManager.getInstance();
    const statuses = manager.getAllStatuses();

    return NextResponse.json({ data: statuses });
  } catch (error) {
    console.error('Error fetching data source statuses:', error);
    return NextResponse.json({ error: 'Failed to fetch data source statuses' }, { status: 500 });
  }
}
