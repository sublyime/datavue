import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, requirePermission } from '@/middleware/auth';
import { suggestDatabaseConfig } from '@/ai/flows/suggest-database-config';

// POST /api/storage/config/suggest - Get AI-suggested storage configuration
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  // Check if user is defined before accessing properties
  if (!authResult.user || !requirePermission(authResult.user, 'storage', 'create')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    if (!body.dataVolume || !body.dataVelocity || !body.intendedAnalysis) {
      return NextResponse.json(
        { error: 'dataVolume, dataVelocity, and intendedAnalysis are required' },
        { status: 400 }
      );
    }

    // Use the AI flow to suggest database configuration
    const suggestion = await suggestDatabaseConfig({
      dataVolume: body.dataVolume,
      dataVelocity: body.dataVelocity,
      intendedAnalysis: body.intendedAnalysis,
      // Optional fields
      requirements: body.requirements,
      performanceNeeds: body.performanceNeeds,
      budgetConstraints: body.budgetConstraints
    });

    return NextResponse.json({ data: suggestion });
  } catch (error) {
    console.error('Error getting storage suggestion:', error);
    return NextResponse.json({ error: 'Failed to get storage suggestion' }, { status: 500 });
  }
}