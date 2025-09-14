import { BaseDataSource } from '../base';
import { DataPoint, DataSourceConfig } from '../types';
import net from 'net';

export class TCPDataSource extends BaseDataSource {
  private client: net.Socket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  async initialize() {
    this.validateConfig(['host', 'port']);
    console.log(`Initializing TCP source: ${this.config.config.host}:${this.config.config.port}`);
  }

  async start() {
    try {
      this.client = new net.Socket();
      
      this.client.connect(this.config.config.port, this.config.config.host, () => {
        console.log(`TCP connected to ${this.config.config.host}:${this.config.config.port}`);
        this.isRunning = true;
      });

      this.client.on('data', (data) => {
        this.handleData(data.toString());
      });

      this.client.on('error', (error) => {
        console.error(`TCP connection error:`, error);
        this.scheduleReconnect();
      });

      this.client.on('close', () => {
        console.log('TCP connection closed');
        this.scheduleReconnect();
      });

    } catch (error) {
      console.error(`Failed to start TCP source:`, error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    this.isRunning = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const reconnectInterval = this.config.config.reconnectInterval || 5000;
    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect TCP...');
      this.start();
    }, reconnectInterval);
  }

  async stop() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.client) {
      this.client.destroy();
      this.client = null;
    }

    this.isRunning = false;
  }

  async processData(data: string): Promise<DataPoint[]> {
    const timestamp = new Date();
    const format = this.config.config.messageFormat || 'raw';
    
    if (format === 'json') {
      return this.parseJSON(data, timestamp);
    } else if (format === 'csv') {
      return this.parseCSV(data, timestamp);
    } else {
      // Raw data
      return [{
        sourceId: this.config.id,
        tagName: 'tcp_data',
        value: data,
        quality: 192,
        timestamp,
        metadata: {
          rawData: data,
          sourceType: 'TCP',
          host: this.config.config.host,
          port: this.config.config.port,
        },
      }];
    }
  }

  private parseJSON(data: string, timestamp: Date): DataPoint[] {
    try {
      const jsonData = JSON.parse(data);
      const points: DataPoint[] = [];
      this.flattenJSON(jsonData, '', points, timestamp);
      return points;
    } catch (error) {
      return [{
        sourceId: this.config.id,
        tagName: 'tcp_data_raw',
        value: data,
        quality: 192,
        timestamp,
        metadata: {
          sourceType: 'TCP',
          host: this.config.config.host,
          port: this.config.config.port,
          parseError: 'JSON parse error',
        },
      }];
    }
  }

  private parseCSV(data: string, timestamp: Date): DataPoint[] {
    const points: DataPoint[] = [];
    const delimiter = this.config.config.delimiter || ',';
    const values = data.trim().split(delimiter);
    
    values.forEach((value, index) => {
      points.push({
        sourceId: this.config.id,
        tagName: `tcp_field_${index}`,
        value: isNaN(Number(value)) ? value : Number(value),
        quality: 192,
        timestamp,
        metadata: {
          sourceType: 'TCP',
          host: this.config.config.host,
          port: this.config.config.port,
          fieldIndex: index,
        },
      });
    });
    
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
            quality: 192,
            timestamp,
            metadata: {
              sourceType: 'TCP',
              host: this.config.config.host,
              port: this.config.config.port,
            },
          });
        }
      }
    }
  }
}

// Factory function
export function create(config: DataSourceConfig): TCPDataSource {
  return new TCPDataSource(config);
}
