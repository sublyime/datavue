// app/api/data-sources/test-connection/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, requirePermission } from '@/middleware/auth';

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  if (!authResult.user || !requirePermission(authResult.user, 'data_sources', 'create')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.type || !body.protocol || !body.config) {
      return NextResponse.json({ 
        error: 'Missing required fields: type, protocol, config',
        connected: false 
      }, { status: 400 });
    }

    // Test connection based on protocol type
    let connected = false;
    let message = '';

    switch (body.protocol) {
      case 'API':
        try {
          const response = await fetch(body.config.url, {
            method: body.config.method || 'GET',
            headers: body.config.headers || {},
            signal: AbortSignal.timeout(5000), // 5 second timeout
          });
          connected = response.ok;
          message = connected ? 'API connection successful' : `API returned status ${response.status}`;
        } catch (error) {
          connected = false;
          message = `API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
        break;

      case 'TCP':
        try {
          const net = await import('net');
          const socket = new net.Socket();
          
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              socket.destroy();
              reject(new Error('Connection timeout'));
            }, 5000);

            socket.connect(body.config.port, body.config.host, () => {
              clearTimeout(timeout);
              connected = true;
              message = 'TCP connection successful';
              socket.destroy();
              resolve(true);
            });

            socket.on('error', (error) => {
              clearTimeout(timeout);
              connected = false;
              message = `TCP connection failed: ${error.message}`;
              reject(error);
            });
          });
        } catch (error) {
          connected = false;
          message = `TCP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
        break;

      case 'MQTT':
        try {
          const mqtt = await import('mqtt');
          const client = mqtt.connect(body.config.brokerUrl, {
            connectTimeout: 5000,
            clientId: `test_${Date.now()}`,
          });

          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              client.end(true);
              reject(new Error('Connection timeout'));
            }, 5000);

            client.on('connect', () => {
              clearTimeout(timeout);
              connected = true;
              message = 'MQTT connection successful';
              client.end(true);
              resolve(true);
            });

            client.on('error', (error) => {
              clearTimeout(timeout);
              connected = false;
              message = `MQTT connection failed: ${error.message}`;
              client.end(true);
              reject(error);
            });
          });
        } catch (error) {
          connected = false;
          message = `MQTT connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
        break;

      case 'FILE':
        try {
          const fs = await import('fs');
          const exists = fs.existsSync(body.config.path);
          connected = exists;
          message = exists ? 'File exists and is accessible' : 'File not found or not accessible';
        } catch (error) {
          connected = false;
          message = `File access failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
        break;

      default:
        connected = false;
        message = `Connection testing not implemented for protocol: ${body.protocol}`;
    }

    return NextResponse.json({ 
      data: { 
        connected, 
        message 
      } 
    });

  } catch (error) {
    console.error('Error testing connection:', error);
    return NextResponse.json({ 
      data: { 
        connected: false, 
        message: error instanceof Error ? error.message : 'Connection test failed' 
      } 
    }, { status: 500 });
  }
}
