import { BaseDataSource } from '../base';
import { DataPoint, DataSourceConfig } from '../types';

export class TestDataSource extends BaseDataSource {
  private interval: NodeJS.Timeout | null = null;

  async initialize() {
    console.log(`🧪 Initializing TEST source: ${this.config.name}`);
    // No validation needed for test source
  }

  async start() {
    console.log(`🧪 Starting TEST source: ${this.config.name}`);
    
    // Generate test data every 5 seconds
    this.interval = setInterval(() => {
      this.generateTestData();
    }, 5000);
    
    // Generate initial data
    await this.generateTestData();
    this.isRunning = true;
    
    console.log(`✅ TEST source started: ${this.config.name}`);
  }

  async stop() {
    console.log(`🧪 Stopping TEST source: ${this.config.name}`);
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    
    console.log(`⏹️ TEST source stopped: ${this.config.name}`);
  }

  private async generateTestData() {
    const testData = {
      temperature: 20 + Math.random() * 10,
      humidity: 40 + Math.random() * 20,
      pressure: 1000 + Math.random() * 50,
      vibration: Math.random() * 5,
      timestamp: new Date(),
    };
    
    console.log(`🧪 Generated test data:`, testData);
    await this.handleData(testData);
  }

  async processData(data: any): Promise<DataPoint[]> {
    const timestamp = new Date();
    const points: DataPoint[] = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'timestamp') {
        points.push({
          sourceId: this.config.id,
          tagName: key,
          value: value,
          quality: 192,
          timestamp,
          metadata: {
            sourceType: 'TEST',
            generated: true,
          },
        });
      }
    }
    
    return points;
  }
}

// Factory function
export function create(config: DataSourceConfig): TestDataSource {
  return new TestDataSource(config);
}
