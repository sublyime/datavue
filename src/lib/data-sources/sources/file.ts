import { BaseDataSource } from '../base';
import { DataPoint } from '../types';
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
    
    return [{
      tagName: 'file_data',
      value: data,
      quality: 100,
      timestamp,
      metadata: {
        sourceType: 'FILE',
        path: this.config.config.path,
        format: this.config.config.format || 'text',
      },
    }];
  }
}