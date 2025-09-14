import { BaseDataSource } from '../base';
import { DataPoint, DataSourceConfig } from '../types';

export class APIDataSource extends BaseDataSource {
  private pollInterval: NodeJS.Timeout | null = null;

  async initialize() {
    this.validateConfig(['url', 'method']);
    console.log(`Initializing API source: ${this.config.config.url}`);
  }

  async start() {
    const pollInterval = this.config.config.pollInterval || 60000;
    this.pollInterval = setInterval(() => {
      this.pollAPI();
    }, pollInterval);
    
    // Initial poll
    await this.pollAPI();
    this.isRunning = true;
  }

  async stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isRunning = false;
  }

  private async pollAPI() {
    try {
      const response = await fetch(this.config.config.url, {
        method: this.config.config.method || 'GET',
        headers: this.config.config.headers || {},
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      await this.handleData(data);
    } catch (error) {
      console.error('API poll error:', error);
    }
  }

  async processData(data: any): Promise<DataPoint[]> {
    const timestamp = new Date();
    const points: DataPoint[] = [];
    this.flattenJSON(data, '', points, timestamp);
    return points;
  }

  private flattenJSON(obj: any, prefix: string, points: DataPoint[], timestamp: Date) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          this.flattenJSON(value, fullKey, points, timestamp);
        } else {
          points.push({
            sourceId: this.config.id,
            tagName: fullKey,
            value: value,
            quality: 192, // GOOD quality
            timestamp,
            metadata: {
              sourceType: 'API',
              url: this.config.config.url,
            },
          });
        }
      }
    }
  }
}

// Factory function
export function create(config: DataSourceConfig): APIDataSource {
  return new APIDataSource(config);
}
