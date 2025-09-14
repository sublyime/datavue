import { DataSourceConfig, DataPoint } from './types';
import { DataSourceManager } from './manager';

export abstract class BaseDataSource {
  protected config: DataSourceConfig;
  protected isRunning: boolean = false;
  protected manager: DataSourceManager;

  constructor(config: DataSourceConfig) {
    this.config = config;
    this.manager = DataSourceManager.getInstance();
  }

  abstract initialize(): Promise<void>;
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract processData(rawData: any): Promise<DataPoint[]>;

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastActivity: new Date(),
      config: this.config,
    };
  }

  protected async handleData(rawData: any) {
    try {
      const dataPoints = await this.processData(rawData);
      
      for (const point of dataPoints) {
        await this.manager.storeDataPoint({
          ...point,
          sourceId: this.config.id,
          timestamp: point.timestamp || new Date(),
        });
      }

      // TODO: Add real-time event emission for WebSocket connections
      console.log(`Processed ${dataPoints.length} data points from ${this.config.name}`);
    } catch (error) {
      console.error(`Error processing data from ${this.config.name}:`, error);
    }
  }

  protected validateConfig(requiredFields: string[]) {
    for (const field of requiredFields) {
      if (!this.config.config[field]) {
        throw new Error(`Missing required config field: ${field}`);
      }
    }
  }
}