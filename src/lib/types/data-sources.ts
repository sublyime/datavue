// src/lib/types/data-sources.ts
export interface DataSourceStatusUI {
    id: number;
    name: string;
    description?: string;
    interfaceType: string;
    protocolType: string;
    dataSourceType: string;
    isRunning: boolean;
    connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
    lastActivity?: Date;
    recordsProcessed: number;
    errorsCount: number;
    lastError?: string;
    isActive: boolean;
    latitude?: number;
    longitude?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface DataSourceManagerStats {
    dataSources: DataSourceStatusUI[];
    summary: {
        total: number;
        active: number;
        connected: number;
        errors: number;
    };
    debugInfo?: any;
}

export interface DataSourceAction {
    action: 'start' | 'stop' | 'restart' | 'remove';
    sourceId?: number;
    config?: any;
}

export type DataSourceConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';
