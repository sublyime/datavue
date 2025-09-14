import { BaseDataSource } from '../base';
import { DataPoint, DataSourceConfig } from '../types';
import fs from 'fs';
import path from 'path';

export class FileDataSource extends BaseDataSource {
  private pollInterval: NodeJS.Timeout | null = null;
  private lastPosition: number = 0;

  async initialize() {
    this.validateConfig(['path']);
    console.log(`Initializing file source: ${this.config.config.path}`);
  }

  async start() {
    const pollInterval = this.config.config.pollInterval || 5000;
    this.pollInterval = setInterval(() => {
      this.pollFile();
    }, pollInterval);
    
    // Initial poll
    await this.pollFile();
    this.isRunning = true;
  }

  async stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isRunning = false;
  }

  private async pollFile() {
    try {
      const filePath = this.config.config.path;
      
      if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return;
      }

      const stats = fs.statSync(filePath);
      if (stats.size <= this.lastPosition) {
        // No new data
        return;
      }

      const stream = fs.createReadStream(filePath, {
        start: this.lastPosition,
        encoding: 'utf8'
      });

      let newData = '';
      for await (const chunk of stream) {
        newData += chunk;
      }

      this.lastPosition = stats.size;
      
      if (newData.trim()) {
        await this.handleData(newData);
      }

    } catch (error) {
      console.error('File poll error:', error);
    }
  }

  async processData(data: string): Promise<DataPoint[]> {
    const timestamp = new Date();
    const format = this.config.config.format || 'text';
    
    if (format === 'csv') {
      return this.parseCSV(data, timestamp);
    } else if (format === 'json') {
      return this.parseJSON(data, timestamp);
    } else {
      // Raw text
      return [{
        sourceId: this.config.id,
        tagName: 'file_data',
        value: data,
        quality: 192,
        timestamp,
        metadata: {
          sourceType: 'FILE',
          path: this.config.config.path,
          format: format,
        },
      }];
    }
  }

  private parseCSV(data: string, timestamp: Date): DataPoint[] {
    const points: DataPoint[] = [];
    const lines = data.trim().split('\n');
    const headers = this.config.config.headers || [];
    
    lines.forEach((line, index) => {
      const values = line.split(this.config.config.delimiter || ',');
      values.forEach((value, colIndex) => {
        const tagName = headers[colIndex] || `column_${colIndex}`;
        points.push({
          sourceId: this.config.id,
          tagName: `${tagName}_line_${index}`,
          value: isNaN(Number(value)) ? value : Number(value),
          quality: 192,
          timestamp,
          metadata: {
            sourceType: 'FILE',
            path: this.config.config.path,
            format: 'csv',
            line: index,
            column: colIndex,
          },
        });
      });
    });
    
    return points;
  }

  private parseJSON(data: string, timestamp: Date): DataPoint[] {
    try {
      const jsonData = JSON.parse(data);
      const points: DataPoint[] = [];
      this.flattenJSON(jsonData, '', points, timestamp);
      return points;
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return [{
        sourceId: this.config.id,
        tagName: 'file_data_raw',
        value: data,
        quality: 192,
        timestamp,
        metadata: {
          sourceType: 'FILE',
          path: this.config.config.path,
          format: 'json',
          parseError: error instanceof Error ? error.message : 'Parse error',
        },
      }];
    }
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
              sourceType: 'FILE',
              path: this.config.config.path,
              format: 'json',
            },
          });
        }
      }
    }
  }
}

// Factory function
export function create(config: DataSourceConfig): FileDataSource {
  return new FileDataSource(config);
}
