import { BaseDataSource } from '../base';
import { DataPoint, DataSourceConfig } from '../types';

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

      this.port.on('open', () => {
        console.log(`Serial port opened: ${this.config.config.port}`);
        this.isRunning = true;
      });

      this.port.on('close', () => {
        console.log(`Serial port closed: ${this.config.config.port}`);
        this.isRunning = false;
      });

    } catch (error) {
      console.error(`Failed to start serial source ${this.config.config.port}:`, error);
      throw error;
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
      
      // Handle NMEA sentences if protocol is NMEA
      if (this.config.protocol === 'NMEA') {
        return this.parseNMEA(value, timestamp);
      }
      
      // Default processing
      return [{
        sourceId: this.config.id,
        tagName: 'serial_data',
        value: value,
        quality: 192,
        timestamp,
        metadata: {
          rawData: data,
          sourceType: 'SERIAL',
          protocol: this.config.protocol,
          port: this.config.config.port,
        },
      }];
    } catch (error) {
      console.error('Error processing serial data:', error);
      return [];
    }
  }

  private parseNMEA(sentence: string, timestamp: Date): DataPoint[] {
    const points: DataPoint[] = [];
    
    // Basic NMEA parsing - you can expand this
    if (sentence.startsWith('$')) {
      const parts = sentence.split(',');
      const sentenceType = parts[0];
      
      // Filter sentences if specified
      const sentences = this.config.config.sentences;
      if (sentences && sentences.length > 0 && !sentences.includes(sentenceType.substring(3))) {
        return points;
      }
      
      points.push({
        sourceId: this.config.id,
        tagName: `nmea_${sentenceType}`,
        value: sentence,
        quality: 192,
        timestamp,
        metadata: {
          sourceType: 'SERIAL',
          protocol: 'NMEA',
          sentenceType: sentenceType,
          port: this.config.config.port,
        },
      });
      
      // Parse specific sentence types
      if (sentenceType === '$GPGGA' && parts.length >= 15) {
        // GPS Fix Data
        const latitude = this.convertCoordinate(parts[2], parts[3]);
        const longitude = this.convertCoordinate(parts[4], parts[5]);
        
        if (latitude !== null && longitude !== null) {
          points.push({
            sourceId: this.config.id,
            tagName: 'gps_latitude',
            value: latitude,
            quality: 192,
            timestamp,
            location: { latitude, longitude },
            metadata: { sourceType: 'SERIAL', protocol: 'NMEA', sentenceType: 'GPGGA' },
          });
          
          points.push({
            sourceId: this.config.id,
            tagName: 'gps_longitude',
            value: longitude,
            quality: 192,
            timestamp,
            location: { latitude, longitude },
            metadata: { sourceType: 'SERIAL', protocol: 'NMEA', sentenceType: 'GPGGA' },
          });
        }
      }
    }
    
    return points;
  }

  private convertCoordinate(coord: string, direction: string): number | null {
    if (!coord || !direction) return null;
    
    const degrees = parseInt(coord.substring(0, coord.indexOf('.') - 2));
    const minutes = parseFloat(coord.substring(coord.indexOf('.') - 2));
    
    let decimal = degrees + minutes / 60;
    
    if (direction === 'S' || direction === 'W') {
      decimal = -decimal;
    }
    
    return decimal;
  }
}

// Factory function
export function create(config: DataSourceConfig): SerialDataSource {
  return new SerialDataSource(config);
}
