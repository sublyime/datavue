import { BaseDataSource } from '../base';
import { DataPoint } from '../types';

export class ModbusDataSource extends BaseDataSource {
  private client: any = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pollInterval: NodeJS.Timeout | null = null;

  async initialize() {
    this.validateConfig(['address', 'unitId']);
    console.log(`Initializing Modbus source: ${this.config.config.address}`);
  }

  async start() {
    try {
      // Dynamic import to avoid server-side issues
      const ModbusRTU = await import('modbus-serial');
      this.client = new ModbusRTU.default();
      
      if (this.config.config.type === 'tcp') {
        await this.client.connectTCP(this.config.config.address, {
          port: this.config.config.port || 502,
        });
      } else {
        await this.client.connectRTUBuffered(this.config.config.address, {
          baudRate: this.config.config.baudRate || 9600,
        });
      }

      this.client.setID(this.config.config.unitId || 1);
      this.client.setTimeout(this.config.config.timeout || 5000);

      this.startPolling();
      this.isRunning = true;

    } catch (error) {
      console.error('Failed to start Modbus source:', error);
      this.scheduleReconnect();
    }
  }

  private startPolling() {
    const pollInterval = this.config.config.pollInterval || 10000;
    
    this.pollInterval = setInterval(async () => {
      try {
        await this.pollModbus();
      } catch (error) {
        console.error('Modbus poll error:', error);
      }
    }, pollInterval);
  }

  private async pollModbus() {
    if (!this.client) return;

    try {
      // Read holding registers (example)
      const data = await this.client.readHoldingRegisters(0, 10);
      await this.handleData(data);

    } catch (error) {
      console.error('Modbus read error:', error);
    }
  }

  private scheduleReconnect() {
    this.isRunning = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    
    const reconnectInterval = this.config.config.reconnectInterval || 10000;
    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect Modbus...');
      this.start();
    }, reconnectInterval);
  }

  async stop() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (this.client) {
      this.client.close();
    }
    this.isRunning = false;
  }

  async processData(data: any): Promise<DataPoint[]> {
    const timestamp = new Date();
    const points: DataPoint[] = [];

    if (data && data.data && Array.isArray(data.data)) {
      data.data.forEach((value: number, index: number) => {
        points.push({
          tagName: `register_${index}`,
          value: value,
          quality: 100,
          timestamp,
          metadata: {
            sourceType: 'MODBUS',
            address: this.config.config.address,
            unitId: this.config.config.unitId,
            register: index,
          },
        });
      });
    }

    return points;
  }
}