import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/middleware/auth';
import { DataSourceManager } from '@/lib/data-sources/manager';
import { initializeDataSourceManager } from '@/lib/data-sources/init';

export async function GET(request: NextRequest) {
    const authResult = await authenticateRequest(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        // Ensure manager is initialized
        await initializeDataSourceManager();
        const manager = DataSourceManager.getInstance();
        
        // Get all status information
        const statuses = manager.getAllStatuses();
        const debugInfo = manager.getDebugInfo();
        
        return NextResponse.json({
            dataSources: statuses,
            summary: {
                total: statuses.length,
                active: statuses.filter(s => s.isRunning).length,
                connected: statuses.filter(s => s.connectionStatus === 'connected').length,
                errors: statuses.filter(s => s.errorsCount > 0).length
            },
            debugInfo: debugInfo
        });
    } catch (error) {
        console.error('Failed to get data source manager status:', error);
        return NextResponse.json({ 
            error: 'Failed to get data source status' 
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const authResult = await authenticateRequest(request);
    if (authResult.error) {
        return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    try {
        const body = await request.json();
        // ✅ FIXED: Properly declare action variable
        const { action, sourceId, config } = body;
        
        if (!action) {
            return NextResponse.json({ error: 'Missing action parameter' }, { status: 400 });
        }

        await initializeDataSourceManager();
        const manager = DataSourceManager.getInstance();
        
        // ✅ FIXED: Use scoped blocks in switch statement
        switch (action) {
            case 'start': {
                if (!config) {
                    return NextResponse.json({ error: 'Config required for start action' }, { status: 400 });
                }
                console.log(`🚀 Starting data source: ${config.name}`);
                await manager.startSource(config);
                return NextResponse.json({ 
                    success: true,
                    message: `Data source ${config.name} started successfully` 
                });
            }
                
            case 'stop': {
                if (!sourceId) {
                    return NextResponse.json({ error: 'sourceId required for stop action' }, { status: 400 });
                }
                console.log(`⏹️ Stopping data source ID: ${sourceId}`);
                await manager.stopSource(sourceId);
                return NextResponse.json({ 
                    success: true,
                    message: `Data source ${sourceId} stopped successfully` 
                });
            }
                
            case 'restart': {
                if (!sourceId) {
                    return NextResponse.json({ error: 'sourceId required for restart action' }, { status: 400 });
                }
                console.log(`🔄 Restarting data source ID: ${sourceId}`);
                await manager.restartSource(sourceId);
                return NextResponse.json({ 
                    success: true,
                    message: `Data source ${sourceId} restarted successfully` 
                });
            }
                
            case 'remove': {
                if (!sourceId) {
                    return NextResponse.json({ error: 'sourceId required for remove action' }, { status: 400 });
                }
                console.log(`🗑️ Removing data source ID: ${sourceId}`);
                await manager.removeSource(sourceId);
                return NextResponse.json({ 
                    success: true,
                    message: `Data source ${sourceId} removed successfully` 
                });
            }
                
            default: {
                return NextResponse.json({ 
                    error: `Unknown action: ${action}` 
                }, { status: 400 });
            }
        }
        
    } catch (error) {
        console.error(`Data source operation failed:`, error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : 'Operation failed' 
        }, { status: 500 });
    }
}
