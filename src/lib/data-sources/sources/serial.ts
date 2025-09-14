import { BaseDataSource } from '../base';
import { DataPoint } from '../types';

export class SerialDataSource extends BaseDataSource {
  private port: any = null;
  private parser: any = null;

  async initialize() {
    this.validateConfig(['port', 'baudRate']);
    console.log(`Initializing serial source: ${this.config.config.port}`);
  }

  async start() {
    try {
      // Dynamic import to avoid server-side issues
      const { SerialPort } = await import('serialport');
      const { ReadlineParser } = await import('@serialport/parser-readline');

      this.port = new SerialPort({
        path: this.config.config.port,
        baudRate: this.config.config.baudRate || 9600,
        dataBits: this.config.config.dataBits || 8,
        stopBits: this.config.config.stopBits || 1,
        parity: this.config.config.parity || 'none',
      });

      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
      this.parser.on('data', (data: string) => this.handleData(data));

      this.port.on('error', (error: any) => {
        console.error(`Serial port error (${this.config.config.port}):`, error);
      });

      this.isRunning = true;
      console.log(`Serial source started: ${this.config.config.port}`);
    } catch (error) {
      console.error(`Failed to start serial source ${this.config.config.port}:`, error);
    }
  }

  async stop() {
    if (this.port && this.port.isOpen) {
      this.port.close();
    }
    this.isRunning = false;
  }

  async processData(data: string): Promise<DataPoint[]> {
    try {
      const timestamp = new Date();
      const value = data.trim();
      
      return [{
        tagName: 'raw_data',
        value: value,
        quality: 100,
        timestamp,
        metadata: {
          rawData: data,
          sourceType: 'SERIAL',
          protocol: this.config.protocol,
        },
      }];
    } catch (error) {
      console.error('Error processing serial data:', error);
      return [];
    }
  }
}