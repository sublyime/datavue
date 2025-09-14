import { DataSourceConfig, DataPoint } from './types';
import { db } from '@/lib/db';
import { dataPoints } from '@/lib/db/schema';

export abstract class BaseDataSource {
  protected config: any; // Use any for legacy compatibility
  protected isRunning: boolean = false;

  constructor(config: any) {
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

      console.log(`✅ Processed ${processedPoints.length} data points from ${this.config.name}`);
    } catch (error) {
      console.error(`❌ Error processing data from ${this.config.name}:`, error);
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
      console.error(`❌ Error storing data point for ${this.config.name}:`, error);
      throw error;
    }
  }

  // Fixed validation method that works with legacy config structure
  protected validateConfig(requiredFields: string[]) {
    console.log(`🔍 Validating config for ${this.config.name}:`, this.config.config);
    
    if (!this.config.config) {
      const error = new Error(`Config object is missing for ${this.config.name}`);
      console.error('❌', error.message);
      throw error;
    }

    const config = this.config.config;
    
    for (const field of requiredFields) {
      if (config[field] === undefined || config[field] === null) {
        const error = new Error(`Missing required config field: ${field} for ${this.config.name}`);
        console.error('❌', error.message);
        console.error('❌ Available config fields:', Object.keys(config));
        throw error;
      }
    }
    
    console.log(`✅ Config validation passed for ${this.config.name}`);
  }

  // Helper methods for accessing config values safely
  protected getConfigValue(key: string, defaultValue?: any): any {
    if (!this.config.config) {
      console.warn(`⚠️ Config object missing for ${this.config.name}, returning default value for ${key}`);
      return defaultValue;
    }
    return this.config.config[key] !== undefined ? this.config.config[key] : defaultValue;
  }

  protected requireConfigValue(key: string): any {
    const value = this.getConfigValue(key);
    if (value === undefined || value === null) {
      throw new Error(`Required config field '${key}' is missing for ${this.config.name}`);
    }
    return value;
  }

  // Common config accessors with safe defaults
  protected getHost(): string {
    return this.getConfigValue('host') || 
           this.getConfigValue('brokerUrl') || 
           this.getConfigValue('endpoint') || 
           'localhost';
  }

  protected getPort(): number {
    return this.getConfigValue('port', 80);
  }

  protected getTimeout(): number {
    return this.getConfigValue('timeout', 5000);
  }

  protected getPollInterval(): number {
    return this.getConfigValue('pollInterval', 10000);
  }

  protected getReconnectInterval(): number {
    return this.getConfigValue('reconnectInterval', 5000);
  }

  protected getMaxRetries(): number {
    return this.getConfigValue('maxRetries', 3);
  }
}
