// src/lib/data-sources/manager.ts

import { DataSourceConfig, DataSourceStatus, DataSourceRuntimeStatus } from './types';
import { EventEmitter } from 'events';

interface ActiveDataSource {
  id: number;
  config: DataSourceConfig;
  status: DataSourceRuntimeStatus;
  instance?: any; // The actual data source implementation
  lastActivity: Date;
}

export class DataSourceManager extends EventEmitter {
  private static instance: DataSourceManager;
  private activeSources: Map<number, ActiveDataSource> = new Map();
  private statsInterval?: NodeJS.Timeout;

  private constructor() {
    super();
    this.startStatsCollection();
  }

  public static getInstance(): DataSourceManager {
    if (!DataSourceManager.instance) {
      DataSourceManager.instance = new DataSourceManager();
    }
    return DataSourceManager.instance;
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
      };

      this.activeSources.set(config.id, activeSource);

      // Create and start the actual data source implementation
      const sourceInstance = await this.createSourceInstance(config);
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
      throw error;
    }
  }

  public async restartSource(id: number): Promise<void> {
    const activeSource = this.activeSources.get(id);
    if (!activeSource) {
      throw new Error(`Data source ${id} is not active`);
    }

    await this.stopSource(id);
    await this.startSource(activeSource.config);
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
      recordsProcessed: source.status.recordsProcessed || 0,
      errorsCount: 0, // You would track this based on your implementation
      lastError: source.status.lastError,
      connectionStatus: source.status.connectionStatus || 'disconnected',
    }));
  }

  private async createSourceInstance(config: DataSourceConfig): Promise<any> {
    // This is a simplified implementation
    // In a real application, you would create specific instances based on the protocol
    switch (config.protocol) {
      case 'MODBUS':
        return this.createModbusSource(config);
      case 'MQTT':
        return this.createMqttSource(config);
      case 'NMEA':
        return this.createNmeaSource(config);
      case 'OPC':
        return this.createOpcSource(config);
      default:
        throw new Error(`Unsupported protocol: ${config.protocol}`);
    }
  }

  private createModbusSource(config: DataSourceConfig): any {
    // Placeholder for Modbus implementation
    return {
      start: async () => {
        console.log(`Starting Modbus source: ${config.name}`);
        // Implement actual Modbus connection logic here
      },
      stop: async () => {
        console.log(`Stopping Modbus source: ${config.name}`);
      },
      readData: async () => {
        // Implement data reading logic
        return [];
      }
    };
  }

  private createMqttSource(config: DataSourceConfig): any {
    // Placeholder for MQTT implementation
    return {
      start: async () => {
        console.log(`Starting MQTT source: ${config.name}`);
        // Implement actual MQTT connection logic here
      },
      stop: async () => {
        console.log(`Stopping MQTT source: ${config.name}`);
      },
      subscribe: (topics: string[]) => {
        // Implement subscription logic
      }
    };
  }

  private createNmeaSource(config: DataSourceConfig): any {
    // Placeholder for NMEA implementation
    return {
      start: async () => {
        console.log(`Starting NMEA source: ${config.name}`);
        // Implement actual serial port connection logic here
      },
      stop: async () => {
        console.log(`Stopping NMEA source: ${config.name}`);
      }
    };
  }

  private createOpcSource(config: DataSourceConfig): any {
    // Placeholder for OPC implementation
    return {
      start: async () => {
        console.log(`Starting OPC source: ${config.name}`);
        // Implement actual OPC connection logic here
      },
      stop: async () => {
        console.log(`Stopping OPC source: ${config.name}`);
      }
    };
  }

  private startStatsCollection(): void {
    this.statsInterval = setInterval(() => {
      // Update statistics for all active sources
      for (const [id, source] of this.activeSources) {
        if (source.status.isRunning) {
          // Update last activity if the source is active
          source.lastActivity = new Date();
          
          // You could implement actual throughput calculation here
          // based on the specific source implementation
        }
      }
    }, 5000); // Update every 5 seconds
  }

  public destroy(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    // Stop all active sources
    for (const [id] of this.activeSources) {
      this.stopSource(id).catch(console.error);
    }

    this.activeSources.clear();
    this.removeAllListeners();
  }
}