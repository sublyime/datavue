import { BaseDataSource } from '../base';
import { DataPoint, DataSourceConfig } from '../types';
import dgram from 'dgram';

export class UDPDataSource extends BaseDataSource {
  private socket: dgram.Socket | null = null;

  async initialize() {
    this.validateConfig(['port']);
    console.log(`Initializing UDP source on port: ${this.config.config.port}`);
  }

  async start() {
    try {
      this.socket = dgram.createSocket('udp4');

      this.socket.on('message', (msg, rinfo) => {
        this.handleData({
          message: msg.toString(),
          remoteAddress: rinfo.address,
          remotePort: rinfo.port,
        });
      });

      this.socket.on('error', (error) => {
        console.error('UDP socket error:', error);
      });

      this.socket.on('listening', () => {
        const address = this.socket!.address();
        console.log(`UDP listening on ${address.address}:${address.port}`);
        this.isRunning = true;
      });

      this.socket.bind(this.config.config.port);

    } catch (error) {
      console.error('Failed to start UDP source:', error);
      throw error;
    }
  }

  async stop() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isRunning = false;
  }

  async processData(data: any): Promise<DataPoint[]> {
    const timestamp = new Date();
    const message = data.message;
    
    try {
      // Try to parse as JSON
      const jsonData = JSON.parse(message);
      const points: DataPoint[] = [];
      this.flattenJSON(jsonData, '', points, timestamp, data);
      return points;
    } catch {
      // Not JSON, treat as raw data
      return [{
        sourceId: this.config.id,
        tagName: 'udp_data',
        value: message,
        quality: 192,
        timestamp,
        metadata: {
          rawData: message,
          sourceType: 'UDP',
          port: this.config.config.port,
          remoteAddress: data.remoteAddress,
          remotePort: data.remotePort,
        },
      }];
    }
  }

  private flattenJSON(obj: any, prefix: string, points: DataPoint[], timestamp: Date, sourceData: any) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          this.flattenJSON(value, fullKey, points, timestamp, sourceData);
        } else {
          points.push({
            sourceId: this.config.id,
            tagName: fullKey,
            value: value,
            quality: 192,
            timestamp,
            metadata: {
              sourceType: 'UDP',
              port: this.config.config.port,
              remoteAddress: sourceData.remoteAddress,
              remotePort: sourceData.remotePort,
            },
          });
        }
      }
    }
  }
}

// Factory function
export function create(config: DataSourceConfig): UDPDataSource {
  return new UDPDataSource(config);
}
