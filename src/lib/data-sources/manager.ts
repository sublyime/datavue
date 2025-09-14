import { db } from '@/lib/db';
import { dataSources, dataPoints } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { DataSourceConfig, DataPoint, DataSourceType, DataSourceStatus } from './types';
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
      console.warn('Data source manager is already initialized');
      return;
    }

    console.log('Initializing data source manager...');
    
    try {
      // Load all active data sources
      const activeSources = await db.query.dataSources.findMany({
        where: eq(dataSources.isActive, true),
      });

      const startupPromises = activeSources.map(source => 
        this.startSource(source as DataSourceConfig).catch(error => {
          console.error(`Failed to start source ${source.name}:`, error);
          return null;
        })
      );

      await Promise.allSettled(startupPromises);

      const successfulStarts = startupPromises.filter(p => p !== null).length;
      console.log(`Data source manager initialized with ${successfulStarts}/${activeSources.length} active sources`);
      
      this.isInitialized = true;
      this.eventEmitter.emit(DataSourceManager.EVENTS.MANAGER_INITIALIZED, {
        totalSources: activeSources.length,
        successfulStarts,
        failedStarts: activeSources.length - successfulStarts
      });

    } catch (error) {
      console.error('Failed to initialize data source manager:', error);
      throw error;
    }
  }

  async startSource(sourceConfig: DataSourceConfig): Promise<boolean> {
    try {
      // Check if source is already running
      if (this.activeSources.has(sourceConfig.id)) {
        console.warn(`Data source ${sourceConfig.name} (ID: ${sourceConfig.id}) is already running`);
        return true;
      }

      let source: DataSourceInstance;

      switch (sourceConfig.type) {
        case DataSourceType.SERIAL:
          source = new SerialDataSource(sourceConfig);
          break;
        case DataSourceType.TCP:
          source = new TCPDataSource(sourceConfig);
          break;
        case DataSourceType.UDP:
          source = new UDPDataSource(sourceConfig);
          break;
        case DataSourceType.FILE:
          source = new FileDataSource(sourceConfig);
          break;
        case DataSourceType.API:
          source = new APIDataSource(sourceConfig);
          break;
        case DataSourceType.MODBUS:
          source = new ModbusDataSource(sourceConfig);
          break;
        case DataSourceType.MQTT:
          source = new MQTTDataSource(sourceConfig);
          break;
        default:
          throw new Error(`Unsupported data source type: ${sourceConfig.type}`);
      }

      await source.initialize();
      await source.start();
      
      this.activeSources.set(sourceConfig.id, source);
      
      console.log(`Started data source: ${sourceConfig.name} (ID: ${sourceConfig.id}, Type: ${sourceConfig.type})`);
      this.eventEmitter.emit(DataSourceManager.EVENTS.SOURCE_STARTED, {
        sourceId: sourceConfig.id,
        sourceName: sourceConfig.name,
        type: sourceConfig.type
      });

      return true;
    } catch (error) {
      console.error(`Failed to start data source ${sourceConfig.name}:`, error);
      this.eventEmitter.emit(DataSourceManager.EVENTS.SOURCE_ERROR, {
        sourceId: sourceConfig.id,
        sourceName: sourceConfig.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  async stopSource(sourceId: number): Promise<boolean> {
    const source = this.activeSources.get(sourceId);
    if (!source) {
      console.warn(`Data source ID ${sourceId} is not active`);
      return false;
    }

    try {
      await source.stop();
      this.activeSources.delete(sourceId);
      
      console.log(`Stopped data source ID: ${sourceId}`);
      this.eventEmitter.emit(DataSourceManager.EVENTS.SOURCE_STOPPED, {
        sourceId,
        sourceName: source.config.name
      });
      
      return true;
    } catch (error) {
      console.error(`Error stopping source ${sourceId}:`, error);
      return false;
    }
  }

  async restartSource(sourceId: number): Promise<boolean> {
    await this.stopSource(sourceId);
    
    try {
      const sourceConfig = await db.query.dataSources.findFirst({
        where: eq(dataSources.id, sourceId),
      });

      if (!sourceConfig) {
        throw new Error(`Data source with ID ${sourceId} not found in database`);
      }

      return await this.startSource(sourceConfig as DataSourceConfig);
    } catch (error) {
      console.error(`Failed to restart source ${sourceId}:`, error);
      return false;
    }
  }

  getActiveSources() {
    return Array.from(this.activeSources.entries()).map(([id, source]) => ({
      id,
      config: source.config,
      status: source.getStatus ? source.getStatus() : { isRunning: true, lastError: null },
    }));
  }

  getSourceStatus(sourceId: number): DataSourceStatus | null {
    const source = this.activeSources.get(sourceId);
    return source ? (source.getStatus ? source.getStatus() : { isRunning: true, lastError: null }) : null;
  }

  isSourceActive(sourceId: number): boolean {
    return this.activeSources.has(sourceId);
  }

  async storeDataPoint(point: DataPoint): Promise<boolean> {
    try {
      await db.insert(dataPoints).values({
        sourceId: point.sourceId,
        tagName: point.tagName,
        value: point.value,
        quality: point.quality,
        timestamp: point.timestamp,
        location: point.location,
        metadata: point.metadata,
      });

      this.eventEmitter.emit(DataSourceManager.EVENTS.DATA_RECEIVED, point);
      return true;
    } catch (error) {
      console.error('Failed to store data point:', error);
      return false;
    }
  }

  // Event handling methods
  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  once(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.once(event, listener);
  }

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

    const successfulStops = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
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
    (DataSourceManager as any).instance = null;
  }
}