import { db } from '@/lib/db';
import { dataSources, dataPoints } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { DataSourceConfig, DataPoint, DataSourceType, DataSourceStatus, ActiveSourceInfo } from './types';
import { SerialDataSource } from './sources/serial';
import { TCPDataSource } from './sources/tcp';
import { UDPDataSource } from './sources/udp';
import { FileDataSource } from './sources/file';
import { APIDataSource } from './sources/api';
import { ModbusDataSource } from './sources/modbus';
import { MQTTDataSource } from './sources/mqtt';
import { EventEmitter } from 'events';

// Define interface for data source instances
interface DataSourceInstance {
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): DataSourceStatus;
  config: DataSourceConfig;
}

export class DataSourceManager {
  private static instance: DataSourceManager;
  private activeSources: Map<number, DataSourceInstance> = new Map();
  private eventEmitter: EventEmitter = new EventEmitter();
  private isInitialized: boolean = false;

  // Events that can be emitted
  static readonly EVENTS = {
    SOURCE_STARTED: 'sourceStarted',
    SOURCE_STOPPED: 'sourceStopped',
    SOURCE_ERROR: 'sourceError',
    DATA_RECEIVED: 'dataReceived',
    MANAGER_INITIALIZED: 'managerInitialized',
    MANAGER_SHUTDOWN: 'managerShutdown',
  } as const;

  private constructor() {}

  static getInstance(): DataSourceManager {
    if (!DataSourceManager.instance) {
      DataSourceManager.instance = new DataSourceManager();
    }
    return DataSourceManager.instance;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing data source manager...');

      const sources = await db.query.dataSources.findMany({
        where: eq(dataSources.isActive, true),
      });

      for (const source of sources) {
        const SourceClass = this.getDataSourceClass(source.type);
        if (SourceClass) {
          const instance = new SourceClass(source, this.eventEmitter);
          this.activeSources.set(source.id, instance);
          console.log(`Initialized source: ${source.name} (Type: ${source.type})`);
          await instance.initialize();
        } else {
          console.warn(`No class found for data source type: ${source.type}`);
        }
      }

      this.isInitialized = true;
      console.log(`Data source manager initialized with ${this.activeSources.size} active sources.`);
      this.eventEmitter.emit(DataSourceManager.EVENTS.MANAGER_INITIALIZED, {
        sourceCount: this.activeSources.size,
      });

    } catch (error) {
      console.error('Failed to initialize data source manager:', error);
      throw error;
    }
  }

  // NEW: Get all active sources with their info
  getActiveSources(): ActiveSourceInfo[] {
    return Array.from(this.activeSources.entries()).map(([id, instance]) => ({
      id,
      config: instance.config,
      status: instance.getStatus()
    }));
  }

  // NEW: Start a specific source by config
  async startSource(config: DataSourceConfig): Promise<void> {
    const SourceClass = this.getDataSourceClass(config.type);
    if (SourceClass) {
      const instance = new SourceClass(config, this.eventEmitter);
      await instance.initialize();
      await instance.start();
      this.activeSources.set(config.id, instance);
    }
  }

  // NEW: Restart a source
  async restartSource(id: number): Promise<void> {
    await this.stopSource(id);
    const source = await db.query.dataSources.findFirst({
      where: eq(dataSources.id, id),
    });
    if (source) {
      await this.startSource(source);
    }
  }

  // NEW: Stop a specific source
  async stopSource(id: number): Promise<void> {
    const source = this.activeSources.get(id);
    if (source) {
      await source.stop();
      this.activeSources.delete(id);
    }
  }

  // Starts a specific source or all active sources if no ID is provided
  async start(id?: number) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (id) {
      const source = this.activeSources.get(id);
      if (source) {
        await source.start();
        console.log(`Started data source with ID: ${id}`);
        this.eventEmitter.emit(DataSourceManager.EVENTS.SOURCE_STARTED, { id });
      } else {
        console.warn(`Data source with ID ${id} not found.`);
      }
    } else {
      for (const [sourceId, source] of this.activeSources) {
        try {
          await source.start();
          console.log(`Started data source: ${source.config.name}`);
          this.eventEmitter.emit(DataSourceManager.EVENTS.SOURCE_STARTED, { id: sourceId });
        } catch (error) {
          console.error(`Error starting source ${sourceId}:`, error);
          this.eventEmitter.emit(DataSourceManager.EVENTS.SOURCE_ERROR, { id: sourceId, error });
        }
      }
    }
  }

  // Stops a specific source or all active sources if no ID is provided
  async stop(id?: number) {
    if (!this.isInitialized) {
      console.warn('Data source manager is not initialized, nothing to stop.');
      return;
    }

    if (id) {
      const source = this.activeSources.get(id);
      if (source) {
        await source.stop();
        this.activeSources.delete(id);
        console.log(`Stopped data source with ID: ${id}`);
        this.eventEmitter.emit(DataSourceManager.EVENTS.SOURCE_STOPPED, { id });
      } else {
        console.warn(`Data source with ID ${id} not found or already stopped.`);
      }
    } else {
      const stopPromises = Array.from(this.activeSources.values()).map(source => source.stop());
      await Promise.allSettled(stopPromises);
      this.activeSources.clear();
      console.log('All data sources stopped.');
    }
  }

  // Get status of a specific source or all active sources
  getStatus(id?: number): DataSourceStatus[] | DataSourceStatus | undefined {
    if (id) {
      const source = this.activeSources.get(id);
      return source?.getStatus();
    } else {
      return Array.from(this.activeSources.values()).map(source => source.getStatus());
    }
  }

  // Get a source by its ID
  getSource(id: number): DataSourceInstance | undefined {
    return this.activeSources.get(id);
  }

  private getDataSourceClass(type: DataSourceType): any {
    switch (type) {
      case 'SERIAL':
        return SerialDataSource;
      case 'TCP':
        return TCPDataSource;
      case 'UDP':
        return UDPDataSource;
      case 'FILE':
        return FileDataSource;
      case 'API':
        return APIDataSource;
      case 'MODBUS':
        return ModbusDataSource;
      case 'MQTT':
        return MQTTDataSource;
      default:
        return null;
    }
  }

  // Gracefully shuts down the manager and all active sources
  async shutdown() {
    if (!this.isInitialized) {
      console.warn('Data source manager is not initialized');
      return;
    }

    console.log('Shutting down data source manager...');
    
    const stopPromises = Array.from(this.activeSources.entries()).map(
      async ([id, source]) => {
        try {
          await source.stop();
          return { id, success: true };
        } catch (error) {
          console.error(`Error stopping source ${id}:`, error);
          return { id, success: false, error };
        }
      }
    );

    const results = await Promise.allSettled(stopPromises);
    this.activeSources.clear();
    this.isInitialized = false;

    const successfulStops = results.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<{ success: boolean }>).value.success).length;
    console.log(`Data source manager shutdown complete. Stopped ${successfulStops}/${results.length} sources`);
    
    this.eventEmitter.emit(DataSourceManager.EVENTS.MANAGER_SHUTDOWN, {
      totalSources: results.length,
      successfulStops,
      failedStops: results.length - successfulStops
    });
  }

  // Get the number of active sources
  getActiveSourcesCount(): number {
    return this.activeSources.size;
  }

  // Check if manager is initialized
  isManagerInitialized(): boolean {
    return this.isInitialized;
  }

  // Force garbage collection (useful for testing)
  private cleanup() {
    this.activeSources.clear();
    this.eventEmitter.removeAllListeners();
  }
}