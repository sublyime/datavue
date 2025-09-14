import { BaseDataSource } from '../base';
import { DataPoint } from '../types';
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
        this.handleData(msg.toString());
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
    }
  }

  async stop() {
    if (this.socket) {
      this.socket.close();
    }
    this.isRunning = false;
  }

  async processData(data: string): Promise<DataPoint[]> {
    const timestamp = new Date();
    
    return [{
      tagName: 'udp_data',
      value: data,
      quality: 100,
      timestamp,
      metadata: {
        rawData: data,
        sourceType: 'UDP',
        port: this.config.config.port,
      },
    }];
  }
}