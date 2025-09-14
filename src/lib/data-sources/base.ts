import { DataSourceConfig, DataPoint } from './types';
import { db } from '@/lib/db';
import { dataPoints } from '@/lib/db/schema';

export abstract class BaseDataSource {
  protected config: DataSourceConfig;
  protected isRunning: boolean = false;

  constructor(config: DataSourceConfig) {
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract processData(rawData: any): Promise<DataPoint[]>;

  getStatus() {
    return {
      isRunning: this.isRunning,
      lastActivity: new Date(),
      config: this.config,
    };
  }

  protected async handleData(rawData: any) {
    try {
      const processedPoints = await this.processData(rawData);
      
      for (const point of processedPoints) {
        await this.storeDataPoint({
          ...point,
          sourceId: this.config.id,
          timestamp: point.timestamp || new Date(),
        });
      }

      console.log(`✅ Processed ${processedPoints.length} data points from ${this.config.name}`);
    } catch (error) {
      console.error(`❌ Error processing data from ${this.config.name}:`, error);
    }
  }

  protected async storeDataPoint(point: DataPoint) {
    try {
      await db.insert(dataPoints).values({
        sourceId: point.sourceId,
        tagName: point.tagName,
        value: point.value,
        quality: point.quality || 192,
        timestamp: point.timestamp || new Date(),
        location: point.location || null,
        metadata: point.metadata || {},
      });
    } catch (error) {
      console.error(`❌ Error storing data point for ${this.config.name}:`, error);
      throw error;
    }
  }

  // Updated validation methods with proper type handling
  protected validateInterfaceConfig(requiredFields: string[]) {
    console.log(`🔍 Validating interface config for ${this.config.name}:`, this.config.interface.config);
    
    // Cast to Record<string, any> for dynamic property access
    const interfaceConfig = this.config.interface.config as Record<string, any>;
    
    for (const field of requiredFields) {
      if (interfaceConfig[field] === undefined || interfaceConfig[field] === null) {
        const error = new Error(`Missing required interface config field: ${field} for ${this.config.name}`);
        console.error('❌', error.message);
        throw error;
      }
    }
    
    console.log(`✅ Interface config validation passed for ${this.config.name}`);
  }

  protected validateProtocolConfig(requiredFields: string[]) {
    console.log(`🔍 Validating protocol config for ${this.config.name}:`, this.config.protocol.config);
    
    // Cast to Record<string, any> for dynamic property access
    const protocolConfig = this.config.protocol.config as Record<string, any>;
    
    for (const field of requiredFields) {
      if (protocolConfig[field] === undefined || protocolConfig[field] === null) {
        const error = new Error(`Missing required protocol config field: ${field} for ${this.config.name}`);
        console.error('❌', error.message);
        throw error;
      }
    }
    
    console.log(`✅ Protocol config validation passed for ${this.config.name}`);
  }

  // Legacy method for backward compatibility with improved type handling
  protected validateConfig(requiredFields: string[]) {
    console.log(`⚠️ Using legacy validateConfig method for ${this.config.name}`);
    console.log(`🔍 Available configs:`, {
      interface: this.config.interface.config,
      protocol: this.config.protocol.config,
      custom: this.config.dataSource.customConfig
    });
    
    // Cast configs to Record<string, any> for dynamic access
    const interfaceConfig = this.config.interface.config as Record<string, any>;
    const protocolConfig = this.config.protocol.config as Record<string, any>;
    const customConfig = this.config.dataSource.customConfig as Record<string, any> || {};
    
    for (const field of requiredFields) {
      // Check interface config first
      if (interfaceConfig[field] !== undefined && interfaceConfig[field] !== null) {
        continue;
      }
      // Then check protocol config
      if (protocolConfig[field] !== undefined && protocolConfig[field] !== null) {
        continue;
      }
      // Finally check custom config
      if (customConfig[field] !== undefined && customConfig[field] !== null) {
        continue;
      }
      
      const error = new Error(`Missing required config field: ${field} for ${this.config.name}`);
      console.error('❌', error.message);
      throw error;
    }
    
    console.log(`✅ Legacy config validation passed for ${this.config.name}`);
  }

  // Helper methods to access specific configs with proper typing
  protected getInterfaceConfig<T = Record<string, any>>(): T {
    return this.config.interface.config as T;
  }

  protected getProtocolConfig<T = Record<string, any>>(): T {
    return this.config.protocol.config as T;
  }

  protected getCustomConfig<T = Record<string, any>>(): T {
    return this.config.dataSource.customConfig as T || {} as T;
  }

  // Helper method to get combined config (for legacy compatibility)
  protected getCombinedConfig<T = Record<string, any>>(): T {
    return {
      ...(this.config.interface.config as Record<string, any>),
      ...(this.config.protocol.config as Record<string, any>),
      ...(this.config.dataSource.customConfig as Record<string, any> || {}),
    } as T;
  }

  // Helper methods for common config access patterns with safe property access
  protected getHost(): string {
    const interfaceConfig = this.getInterfaceConfig();
    const protocolConfig = this.getProtocolConfig();
    
    return interfaceConfig.host || 
           interfaceConfig.brokerUrl || 
           protocolConfig.host || 
           protocolConfig.brokerUrl || 
           'localhost';
  }

  protected getPort(): number {
    const interfaceConfig = this.getInterfaceConfig();
    const protocolConfig = this.getProtocolConfig();
    
    return interfaceConfig.port || 
           protocolConfig.port || 
           80;
  }

  protected getTimeout(): number {
    const interfaceConfig = this.getInterfaceConfig();
    const protocolConfig = this.getProtocolConfig();
    
    return interfaceConfig.timeout || 
           protocolConfig.timeout || 
           5000;
  }

  protected getPollInterval(): number {
    const protocolConfig = this.getProtocolConfig();
    return protocolConfig.pollInterval || 10000;
  }

  protected getReconnectInterval(): number {
    const interfaceConfig = this.getInterfaceConfig();
    return interfaceConfig.reconnectInterval || 5000;
  }

  protected getMaxRetries(): number {
    const interfaceConfig = this.getInterfaceConfig();
    const protocolConfig = this.getProtocolConfig();
    
    return protocolConfig.maxRetries || 
           interfaceConfig.maxReconnectAttempts || 
           3;
  }

  // Safe property getter with fallback
  protected getConfigValue(section: 'interface' | 'protocol' | 'custom', key: string, defaultValue?: any): any {
    let config: Record<string, any>;
    
    switch (section) {
      case 'interface':
        config = this.getInterfaceConfig();
        break;
      case 'protocol':
        config = this.getProtocolConfig();
        break;
      case 'custom':
        config = this.getCustomConfig();
        break;
      default:
        return defaultValue;
    }
    
    return config[key] !== undefined ? config[key] : defaultValue;
  }

  // Type-safe config accessor with validation
  protected requireConfigValue(section: 'interface' | 'protocol' | 'custom', key: string): any {
    const value = this.getConfigValue(section, key);
    
    if (value === undefined || value === null) {
      throw new Error(`Required ${section} config field '${key}' is missing for ${this.config.name}`);
    }
    
    return value;
  }
}
