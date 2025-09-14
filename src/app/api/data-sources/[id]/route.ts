import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dataSources } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/middleware/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const sourceId = parseInt(params.id);
    const source = await db.query.dataSources.findFirst({
      where: and(
        eq(dataSources.id, sourceId),
        eq(dataSources.userId, authResult.user!.id)
      ),
    });

    if (!source) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    return NextResponse.json({ data: source });
  } catch (error) {
    console.error('Error fetching data source:', error);
    return NextResponse.json({ error: 'Failed to fetch data source' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const sourceId = parseInt(params.id);
    const body = await request.json();

    const updatedSource = await db.update(dataSources)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(and(
        eq(dataSources.id, sourceId),
        eq(dataSources.userId, authResult.user!.id)
      ))
      .returning();

    if (updatedSource.length === 0) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updatedSource[0] });
  } catch (error) {
    console.error('Error updating data source:', error);
    return NextResponse.json({ error: 'Failed to update data source' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const sourceId = parseInt(params.id);
    
    const deletedSource = await db.delete(dataSources)
      .where(and(
        eq(dataSources.id, sourceId),
        eq(dataSources.userId, authResult.user!.id)
      ))
      .returning();

    if (deletedSource.length === 0) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Data source deleted successfully' });
  } catch (error) {
    console.error('Error deleting data source:', error);
    return NextResponse.json({ error: 'Failed to delete data source' }, { status: 500 });
  }
}
