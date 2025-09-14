import { BaseDataSource } from '../base';
import { DataPoint, DataSourceConfig } from '../types';

export class MQTTDataSource extends BaseDataSource {
  private client: any = null;

  async initialize() {
    this.validateConfig(['brokerUrl', 'topics']);
    console.log(`Initializing MQTT source: ${this.config.config.brokerUrl}`);
  }

  async start() {
    try {
      // Dynamic import to avoid server-side issues
      const mqtt = await import('mqtt');
      
      const options: any = {
        clientId: this.config.config.clientId || `historian_${Date.now()}`,
        clean: this.config.config.cleanSession !== false,
        keepalive: this.config.config.keepAlive || 60,
      };

      if (this.config.config.username && this.config.config.password) {
        options.username = this.config.config.username;
        options.password = this.config.config.password;
      }

      this.client = mqtt.connect(this.config.config.brokerUrl, options);

      this.client.on('connect', () => {
        console.log('MQTT connected');
        const topics = Array.isArray(this.config.config.topics) 
          ? this.config.config.topics 
          : [this.config.config.topics];

        topics.forEach(topic => {
          this.client.subscribe(topic, { qos: this.config.config.qos || 0 }, (err: any) => {
            if (err) {
              console.error(`Failed to subscribe to topic ${topic}:`, err);
            } else {
              console.log(`Subscribed to topic: ${topic}`);
            }
          });
        });
        this.isRunning = true;
      });

      this.client.on('message', (topic: string, message: Buffer) => {
        this.handleData({
          topic,
          message: message.toString(),
          timestamp: new Date(),
        });
      });

      this.client.on('error', (error: any) => {
        console.error('MQTT error:', error);
      });

      this.client.on('close', () => {
        console.log('MQTT connection closed');
        this.isRunning = false;
      });

    } catch (error) {
      console.error('Failed to start MQTT source:', error);
      throw error;
    }
  }

  async stop() {
    if (this.client) {
      this.client.end(true);
      this.client = null;
    }
    this.isRunning = false;
  }

  async processData(data: any): Promise<DataPoint[]> {
    const timestamp = new Date();
    
    try {
      let message = data.message;
      
      // Try to parse JSON
      try {
        message = JSON.parse(data.message);
      } catch {
        // Keep as string if not JSON
      }

      const points: DataPoint[] = [];

      if (typeof message === 'object' && message !== null) {
        this.flattenMQTTMessage(message, data.topic, '', points, timestamp);
      } else {
        points.push({
          sourceId: this.config.id,
          tagName: data.topic,
          value: message,
          quality: 192,
          timestamp,
          metadata: {
            sourceType: 'MQTT',
            topic: data.topic,
            broker: this.config.config.brokerUrl,
          },
        });
      }

      return points;
    } catch (error) {
      console.error('Error processing MQTT message:', error);
      return [{
        sourceId: this.config.id,
        tagName: data.topic,
        value: data.message,
        quality: 192,
        timestamp,
        metadata: {
          sourceType: 'MQTT',
          topic: data.topic,
          broker: this.config.config.brokerUrl,
          rawMessage: data.message,
        },
      }];
    }
  }

  private flattenMQTTMessage(obj: any, topic: string, prefix: string, points: DataPoint[], timestamp: Date) {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        const value = obj[key];
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          this.flattenMQTTMessage(value, topic, fullKey, points, timestamp);
        } else {
          points.push({
            sourceId: this.config.id,
            tagName: `${topic}.${fullKey}`,
            value: value,
            quality: 192,
            timestamp,
            metadata: {
              sourceType: 'MQTT',
              topic: topic,
              broker: this.config.config.brokerUrl,
              field: fullKey,
            },
          });
        }
      }
    }
  }
}

// Factory function
export function create(config: DataSourceConfig): MQTTDataSource {
  return new MQTTDataSource(config);
}
