import { DataSourceConfig, DataPoint } from './types';
import { db } from '@/lib/db';
import { dataPoints } from '@/lib/db/schema';

export abstract class BaseDataSource {
  protected config: DataSourceConfig;
  protected isRunning: boolean = false;

  constructor(config: DataSourceConfig) {
    this.config = config;
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
      const processedPoints = await this.processData(rawData);
      
      for (const point of processedPoints) {
        await this.storeDataPoint({
          ...point,
          sourceId: this.config.id,
          timestamp: point.timestamp || new Date(),
        });
      }

      console.log(`Processed ${processedPoints.length} data points from ${this.config.name}`);
    } catch (error) {
      console.error(`Error processing data from ${this.config.name}:`, error);
    }
  }

  protected async storeDataPoint(point: DataPoint) {
    try {
      await db.insert(dataPoints).values({
        sourceId: point.sourceId,
        tagName: point.tagName,
        value: point.value,
        quality: point.quality || 192,
        timestamp: point.timestamp || new Date(),
        location: point.location || null,
        metadata: point.metadata || {},
      });
    } catch (error) {
      console.error('Error storing data point:', error);
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
