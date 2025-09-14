import { BaseDataSource } from '../base';
import { DataPoint } from '../types';
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
    }
    if (this.client) {
      this.client.destroy();
    }
    this.isRunning = false;
  }

  async processData(data: string): Promise<DataPoint[]> {
    const timestamp = new Date();
    
    return [{
      tagName: 'tcp_data',
      value: data,
      quality: 100,
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