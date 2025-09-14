import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, requirePermission } from '@/middleware/auth';
import { translateObscureProtocol } from '@/ai/flows/translate-obscure-protocol';

// POST /api/protocols/translate - Translate protocol data
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!requirePermission(authResult.user, 'protocols', 'translate')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.protocolData || !body.protocolType) {
      return NextResponse.json(
        { error: 'protocolData and protocolType are required' },
        { status: 400 }
      );
    }

    // Use the AI flow to translate the protocol
    const result = await translateObscureProtocol({
      protocolData: body.protocolData,
      protocolType: body.protocolType,
      targetFormat: body.targetFormat || 'JSON',
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error translating protocol:', error);
    return NextResponse.json({ error: 'Failed to translate protocol' }, { status: 500 });
  }
}