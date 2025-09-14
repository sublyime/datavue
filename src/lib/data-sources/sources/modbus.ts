import { BaseDataSource } from '../base';
import { DataPoint, DataSourceConfig } from '../types';

export class ModbusDataSource extends BaseDataSource {
  private client: any = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pollInterval: NodeJS.Timeout | null = null;

  async initialize() {
    this.validateConfig(['host', 'port', 'unitId']);
    console.log(`Initializing Modbus source: ${this.config.config.host}:${this.config.config.port}`);
  }

  async start() {
    try {
      // Dynamic import to avoid server-side issues
      const ModbusRTU = await import('modbus-serial');
      this.client = new ModbusRTU.default();

      await this.client.connectTCP(this.config.config.host, {
        port: this.config.config.port || 502,
      });

      this.client.setID(this.config.config.unitId || 1);
      this.client.setTimeout(this.config.config.timeout || 5000);

      this.startPolling();
      this.isRunning = true;
      console.log(`Modbus TCP connected: ${this.config.config.host}:${this.config.config.port}`);

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
        this.scheduleReconnect();
      }
    }, pollInterval);
  }

  private async pollModbus() {
    if (!this.client) return;

    try {
      const registers = this.config.config.registers || [
        { address: 0, type: 'holding', length: 10, tagName: 'default_registers' }
      ];

      for (const register of registers) {
        let data;
        
        switch (register.type) {
          case 'holding':
            data = await this.client.readHoldingRegisters(register.address, register.length);
            break;
          case 'input':
            data = await this.client.readInputRegisters(register.address, register.length);
            break;
          case 'coil':
            data = await this.client.readCoils(register.address, register.length);
            break;
          case 'discrete':
            data = await this.client.readDiscreteInputs(register.address, register.length);
            break;
          default:
            console.warn(`Unknown register type: ${register.type}`);
            continue;
        }

        await this.handleData({
          register: register,
          data: data,
        });
      }

    } catch (error) {
      console.error('Modbus read error:', error);
      throw error;
    }
  }

  private scheduleReconnect() {
    this.isRunning = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
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
      this.reconnectTimer = null;
    }

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.client) {
      try {
        this.client.close();
      } catch (error) {
        console.error('Error closing Modbus client:', error);
      }
      this.client = null;
    }

    this.isRunning = false;
  }

  async processData(data: any): Promise<DataPoint[]> {
    const timestamp = new Date();
    const points: DataPoint[] = [];
    const register = data.register;
    const values = data.data;

    if (values && values.data && Array.isArray(values.data)) {
      values.data.forEach((value: number, index: number) => {
        points.push({
          sourceId: this.config.id,
          tagName: register.length === 1 ? register.tagName : `${register.tagName}_${index}`,
          value: value,
          quality: 192,
          timestamp,
          metadata: {
            sourceType: 'MODBUS',
            host: this.config.config.host,
            port: this.config.config.port,
            unitId: this.config.config.unitId,
            registerType: register.type,
            registerAddress: register.address + index,
            registerIndex: index,
          },
        });
      });
    } else if (values && typeof values.data !== 'undefined') {
      // Single value
      points.push({
        sourceId: this.config.id,
        tagName: register.tagName,
        value: values.data,
        quality: 192,
        timestamp,
        metadata: {
          sourceType: 'MODBUS',
          host: this.config.config.host,
          port: this.config.config.port,
          unitId: this.config.config.unitId,
          registerType: register.type,
          registerAddress: register.address,
        },
      });
    }

    return points;
  }
}

// Factory function
export function create(config: DataSourceConfig): ModbusDataSource {
  return new ModbusDataSource(config);
}
