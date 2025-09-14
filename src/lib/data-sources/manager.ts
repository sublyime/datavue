// src/lib/data-sources/manager.ts

import { DataSourceConfig, DataSourceStatus, DataSourceRuntimeStatus, DataSourceType, ProtocolType } from './types';
import { EventEmitter } from 'events';
import { db } from '@/lib/db';
import { dataSources } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Import specific data source implementations
import { create as createApiSource } from './sources/api';
import { create as createFileSource } from './sources/file';
import { create as createModbusSource } from './sources/modbus';
import { create as createMqttSource } from './sources/mqtt';
import { create as createSerialSource } from './sources/serial';
import { create as createTcpSource } from './sources/tcp';
import { create as createUdpSource } from './sources/udp';

interface ActiveDataSource {
  id: number;
  config: DataSourceConfig;
  status: DataSourceRuntimeStatus;
  instance?: any; // The actual data source implementation
  lastActivity: Date;
  recordsProcessed: number;
  errorsCount: number;
}

export class DataSourceManager extends EventEmitter {
  private static instance: DataSourceManager;
  private activeSources: Map<number, ActiveDataSource> = new Map();
  private statsInterval?: NodeJS.Timeout;
  private isInitialized: boolean = false;

  private constructor() {
    super();
  }

  public static getInstance(): DataSourceManager {
    if (!DataSourceManager.instance) {
      DataSourceManager.instance = new DataSourceManager();
    }
    return DataSourceManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('Initializing Data Source Manager...');
    
    try {
      // Load and start all active data sources from database
      const activeConfigs = await db.query.dataSources.findMany({
        where: eq(dataSources.isActive, true),
      });

      console.log(`Found ${activeConfigs.length} active data sources to start`);

      for (const dbConfig of activeConfigs) {
        try {
          // Convert database object to DataSourceConfig with proper typing
          const config: DataSourceConfig = {
            id: dbConfig.id,
            name: dbConfig.name,
            type: dbConfig.type as DataSourceType,
            protocol: dbConfig.protocol as ProtocolType,
            config: dbConfig.config as Record<string, any>,
            isActive: dbConfig.isActive,
            userId: dbConfig.userId,
            createdAt: dbConfig.createdAt,
            updatedAt: dbConfig.updatedAt,
          };
          
          await this.startSource(config);
        } catch (error) {
          console.error(`Failed to start data source ${dbConfig.name} (ID: ${dbConfig.id}):`, error);
        }
      }

      this.startStatsCollection();
      this.isInitialized = true;
      console.log('Data Source Manager initialized successfully');

    } catch (error) {
      console.error('Failed to initialize Data Source Manager:', error);
      throw error;
    }
  }

  public async startSource(config: DataSourceConfig): Promise<void> {
    try {
      // Stop existing source if running
      if (this.activeSources.has(config.id)) {
        await this.stopSource(config.id);
      }

      const activeSource: ActiveDataSource = {
        id: config.id,
        config,
        status: {
          isRunning: false,
          connectionStatus: 'connecting',
        },
        lastActivity: new Date(),
        recordsProcessed: 0,
        errorsCount: 0,
      };

      this.activeSources.set(config.id, activeSource);

      // Create and start the actual data source implementation
      const sourceInstance = await this.createSourceInstance(config);
      await sourceInstance.initialize();
      await sourceInstance.start();

      activeSource.instance = sourceInstance;
      activeSource.status.isRunning = true;
      activeSource.status.connectionStatus = 'connected';

      this.emit('sourceStarted', config.id);
      console.log(`Data source ${config.name} (ID: ${config.id}) started successfully`);

    } catch (error) {
      const activeSource = this.activeSources.get(config.id);
      if (activeSource) {
        activeSource.status.isRunning = false;
        activeSource.status.connectionStatus = 'error';
        activeSource.status.lastError = error instanceof Error ? error.message : 'Unknown error';
        activeSource.errorsCount++;
      }

      this.emit('sourceError', config.id, error);
      throw error;
    }
  }

  public async stopSource(id: number): Promise<void> {
    const activeSource = this.activeSources.get(id);
    if (!activeSource) {
      throw new Error(`Data source ${id} is not running`);
    }

    try {
      // Stop the source instance
      if (activeSource.instance && typeof activeSource.instance.stop === 'function') {
        await activeSource.instance.stop();
      }

      activeSource.status.isRunning = false;
      activeSource.status.connectionStatus = 'disconnected';
      
      this.emit('sourceStopped', id);
      console.log(`Data source ${activeSource.config.name} (ID: ${id}) stopped`);

    } catch (error) {
      activeSource.status.lastError = error instanceof Error ? error.message : 'Unknown error';
      activeSource.errorsCount++;
      throw error;
    }
  }

  public async restartSource(id: number): Promise<void> {
    const activeSource = this.activeSources.get(id);
    if (!activeSource) {
      throw new Error(`Data source ${id} is not active`);
    }

    console.log(`Restarting data source ${activeSource.config.name} (ID: ${id})`);
    await this.stopSource(id);
    await this.startSource(activeSource.config);
  }

  public async removeSource(id: number): Promise<void> {
    // Stop the source if it's running
    if (this.activeSources.has(id)) {
      await this.stopSource(id);
      this.activeSources.delete(id);
    }

    // Remove from database
    await db.delete(dataSources).where(eq(dataSources.id, id));
    
    this.emit('sourceRemoved', id);
    console.log(`Data source ${id} removed`);
  }

  public getActiveSources(): Array<{ id: number; status: DataSourceRuntimeStatus }> {
    return Array.from(this.activeSources.values()).map(source => ({
      id: source.id,
      status: { ...source.status }
    }));
  }

  public getSourceStatus(id: number): DataSourceRuntimeStatus | null {
    const activeSource = this.activeSources.get(id);
    return activeSource ? { ...activeSource.status } : null;
  }

  public getAllStatuses(): DataSourceStatus[] {
    return Array.from(this.activeSources.values()).map(source => ({
      id: source.id,
      name: source.config.name,
      isRunning: source.status.isRunning,
      lastActivity: source.lastActivity,
      recordsProcessed: source.recordsProcessed,
      errorsCount: source.errorsCount,
      lastError: source.status.lastError,
      connectionStatus: source.status.connectionStatus || 'disconnected',
    }));
  }

  public async storeDataPoint(point: any): Promise<void> {
    // This method is called by BaseDataSource instances
    const activeSource = this.activeSources.get(point.sourceId);
    if (activeSource) {
      activeSource.recordsProcessed++;
      activeSource.lastActivity = new Date();
    }
  }

  private async createSourceInstance(config: DataSourceConfig): Promise<any> {
    console.log(`Creating source instance for protocol: ${config.protocol}`);
    
    switch (config.protocol) {
      case 'API':
        return createApiSource(config);
      case 'FILE':
        return createFileSource(config);
      case 'MODBUS':
        return createModbusSource(config);
      case 'MQTT':
        return createMqttSource(config);
      case 'NMEA':
      case 'SERIAL':
        return createSerialSource(config);
      case 'TCP':
        return createTcpSource(config);
      case 'UDP':
        return createUdpSource(config);
      default:
        throw new Error(`Unsupported protocol: ${config.protocol}`);
    }
  }

  private startStatsCollection(): void {
    this.statsInterval = setInterval(() => {
      // Update statistics for all active sources
      for (const [id, source] of this.activeSources) {
        if (source.status.isRunning) {
          // Update last activity timestamp for running sources
          // Actual throughput calculation would be based on the specific source implementation
          this.emit('sourceStats', {
            id,
            recordsProcessed: source.recordsProcessed,
            errorsCount: source.errorsCount,
            lastActivity: source.lastActivity,
          });
        }
      }
    }, 5000); // Update every 5 seconds
  }

  public async shutdown(): Promise<void> {
    console.log('Shutting down Data Source Manager...');
    
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    // Stop all active sources
    const stopPromises = Array.from(this.activeSources.keys()).map(id => {
      return this.stopSource(id).catch(error => {
        console.error(`Error stopping source ${id}:`, error);
      });
    });

    await Promise.all(stopPromises);
    this.activeSources.clear();
    this.removeAllListeners();
    this.isInitialized = false;
    
    console.log('Data Source Manager shutdown complete');
  }
}
