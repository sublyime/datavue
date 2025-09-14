// src/lib/data-sources/manager.ts

import { DataSourceConfig, DataSourceStatus, DataSourceRuntimeStatus, InterfaceType, ProtocolType, DataSourceType } from './types';
import { EventEmitter } from 'events';
import { db } from '@/lib/db';
import { dataSources } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Import specific data source implementations
import { create as createApiSource } from './sources/api';
import { create as createFileSource } from './sources/file';
import { create as createModbusSource } from './sources/modbus';
import { create as createMqttSource } from './sources/mqtt';
import { create as createSerialSource } from './sources/serial';
import { create as createTcpSource } from './sources/tcp';
import { create as createUdpSource } from './sources/udp';

interface ActiveDataSource {
  id: number;
  config: DataSourceConfig;
  status: DataSourceRuntimeStatus;
  instance?: any;
  lastActivity: Date;
  recordsProcessed: number;
  errorsCount: number;
}

// FIXED: More flexible config interface that accepts mixed types and will be normalized
interface MergedConfig {
  [key: string]: any;
  // Allow mixed types that will be normalized - common when configs come from JSON/DB
  host?: string;
  hostname?: string;
  port?: number | string;
  tcpPort?: number | string;
  serverPort?: number | string;
  timeout?: number | string;
  connectionTimeout?: number | string;
  unitId?: number | string;
  slaveId?: number | string;
  pollInterval?: number | string;
  maxRetries?: number | string;
  registers?: any[];
  brokerUrl?: string;
  secure?: boolean | string;
  topics?: any[];
  endpoint?: string | number; // FIXED: Allow number which can be converted to string
  url?: string | number; // FIXED: Allow number which can be converted to string  
  method?: string;
}

export class DataSourceManager extends EventEmitter {
  private static instance: DataSourceManager;
  private activeSources: Map<number, ActiveDataSource> = new Map();
  private statsInterval?: NodeJS.Timeout;
  private isInitialized: boolean = false;

  private constructor() {
    super();
  }

  public static getInstance(): DataSourceManager {
    if (!DataSourceManager.instance) {
      DataSourceManager.instance = new DataSourceManager();
    }
    return DataSourceManager.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔄 Data Source Manager already initialized');
      return;
    }

    console.log('🚀 Initializing Data Source Manager...');
    
    try {
      // Test database connectivity first
      console.log('🔍 Testing database connectivity...');
      await this.testDatabaseConnectivity();
      
      // Load and start all active data sources from database
      const activeConfigs = await db.query.dataSources.findMany({
        where: eq(dataSources.isActive, true),
      });

      console.log(`📋 Found ${activeConfigs.length} active data sources to start`);

      for (const dbConfig of activeConfigs) {
        try {
          console.log(`🔧 Processing data source: ${dbConfig.name} (ID: ${dbConfig.id})`);
          
          // Convert database object to DataSourceConfig with proper typing and null handling
          const config: DataSourceConfig = this.convertDbConfigToDataSourceConfig(dbConfig);
          
          await this.startSource(config);
        } catch (error) {
          console.error(`❌ Failed to start data source ${dbConfig.name} (ID: ${dbConfig.id}):`, error);
          // Continue with other sources even if one fails
        }
      }

      this.startStatsCollection();
      this.isInitialized = true;
      console.log('✅ Data Source Manager initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Data Source Manager:', error);
      throw error;
    }
  }

  // Helper method to convert database config to DataSourceConfig
  private convertDbConfigToDataSourceConfig(dbConfig: any): DataSourceConfig {
    // Handle both old and new database structures
    const interfaceType = dbConfig.interfaceType || dbConfig.type || 'TCP';
    const protocolType = dbConfig.protocolType || dbConfig.protocol || 'API_REST';
    const dataSourceType = dbConfig.dataSourceType || dbConfig.type || 'CUSTOM';
    
    // For legacy configs, try to extract interface/protocol from the single config
    const config = dbConfig.config || {};
    const interfaceConfig = dbConfig.interfaceConfig || config;
    const protocolConfig = dbConfig.protocolConfig || config;

    return {
      id: dbConfig.id,
      name: dbConfig.name,
      description: dbConfig.description || undefined,
      interface: {
        type: interfaceType as InterfaceType,
        config: interfaceConfig as any,
      },
      protocol: {
        type: protocolType as ProtocolType,
        config: protocolConfig as any,
      },
      dataSource: {
        type: dataSourceType as DataSourceType,
        templateId: dbConfig.templateId || undefined,
        customConfig: (dbConfig.customConfig as Record<string, any>) || {},
      },
      isActive: dbConfig.isActive,
      userId: dbConfig.userId,
      createdAt: dbConfig.createdAt,
      updatedAt: dbConfig.updatedAt,
    };
  }

  private async testDatabaseConnectivity(): Promise<void> {
    try {
      const testQuery = await db.query.dataSources.findMany({
        limit: 1,
      });
      console.log('✅ Database connectivity test passed');
    } catch (error) {
      console.error('❌ Database connectivity test failed:', error);
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async startSource(config: DataSourceConfig): Promise<void> {
    // Validate config structure
    if (!config.interface) {
      throw new Error(`Invalid config structure for ${config.name}: missing interface`);
    }
    if (!config.protocol) {
      throw new Error(`Invalid config structure for ${config.name}: missing protocol`);
    }
    if (!config.dataSource) {
      throw new Error(`Invalid config structure for ${config.name}: missing dataSource`);
    }

    console.log(`\n🚀 Starting data source: ${config.name} (ID: ${config.id})`);
    console.log(`🔌 Interface: ${config.interface.type}`);
    console.log(`📡 Protocol: ${config.protocol.type}`);
    console.log(`🏭 Data Source Type: ${config.dataSource.type}`);
    console.log(`⚙️ Interface Config:`, JSON.stringify(config.interface.config, null, 2));
    console.log(`📋 Protocol Config:`, JSON.stringify(config.protocol.config, null, 2));
    
    try {
      // Stop existing source if running
      if (this.activeSources.has(config.id)) {
        console.log(`⏹️ Stopping existing source ${config.id} before restart`);
        await this.stopSource(config.id);
      }

      const activeSource: ActiveDataSource = {
        id: config.id,
        config,
        status: {
          isRunning: false,
          connectionStatus: 'connecting',
        },
        lastActivity: new Date(),
        recordsProcessed: 0,
        errorsCount: 0,
      };

      this.activeSources.set(config.id, activeSource);

      console.log(`🏗️ Creating source instance for ${config.interface.type}/${config.protocol.type}`);
      
      // Create and start the actual data source implementation
      const sourceInstance = await this.createSourceInstance(config);
      
      console.log(`🔧 Initializing source instance for: ${config.name}`);
      await sourceInstance.initialize();
      
      console.log(`▶️ Starting source instance for: ${config.name}`);
      await sourceInstance.start();

      activeSource.instance = sourceInstance;
      activeSource.status.isRunning = true;
      activeSource.status.connectionStatus = 'connected';

      this.emit('sourceStarted', config.id);
      console.log(`✅ Data source ${config.name} (ID: ${config.id}) started successfully\n`);

    } catch (error) {
      console.error(`❌ Failed to start data source ${config.name} (ID: ${config.id}):`);
      console.error(`   Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
      console.error(`   Error message: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`   Stack trace:`, error instanceof Error ? error.stack : 'No stack trace available');
      
      const activeSource = this.activeSources.get(config.id);
      if (activeSource) {
        activeSource.status.isRunning = false;
        activeSource.status.connectionStatus = 'error';
        activeSource.status.lastError = error instanceof Error ? error.message : 'Unknown error';
        activeSource.errorsCount++;
      }

      this.emit('sourceError', config.id, error);
      
      // Include more details in the thrown error
      const detailedError = new Error(
        `Failed to start ${config.interface.type}/${config.protocol.type} data source "${config.name}": ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      throw detailedError;
    }
  }

  public async stopSource(id: number): Promise<void> {
    const activeSource = this.activeSources.get(id);
    if (!activeSource) {
      throw new Error(`Data source ${id} is not running`);
    }

    console.log(`⏹️ Stopping data source: ${activeSource.config.name} (ID: ${id})`);

    try {
      // Stop the source instance
      if (activeSource.instance && typeof activeSource.instance.stop === 'function') {
        await activeSource.instance.stop();
      }

      activeSource.status.isRunning = false;
      activeSource.status.connectionStatus = 'disconnected';
      
      this.emit('sourceStopped', id);
      console.log(`✅ Data source ${activeSource.config.name} (ID: ${id}) stopped`);

    } catch (error) {
      console.error(`❌ Error stopping data source ${activeSource.config.name}:`, error);
      activeSource.status.lastError = error instanceof Error ? error.message : 'Unknown error';
      activeSource.errorsCount++;
      throw error;
    }
  }

  public async restartSource(id: number): Promise<void> {
    const activeSource = this.activeSources.get(id);
    if (!activeSource) {
      throw new Error(`Data source ${id} is not active`);
    }

    console.log(`🔄 Restarting data source ${activeSource.config.name} (ID: ${id})`);
    await this.stopSource(id);
    await this.startSource(activeSource.config);
  }

  public async removeSource(id: number): Promise<void> {
    console.log(`🗑️ Removing data source (ID: ${id})`);
    
    // Stop the source if it's running
    if (this.activeSources.has(id)) {
      await this.stopSource(id);
      this.activeSources.delete(id);
    }

    // Remove from database
    await db.delete(dataSources).where(eq(dataSources.id, id));
    
    this.emit('sourceRemoved', id);
    console.log(`✅ Data source ${id} removed`);
  }

  public getActiveSources(): Array<{ id: number; status: DataSourceRuntimeStatus }> {
    return Array.from(this.activeSources.values()).map(source => ({
      id: source.id,
      status: { ...source.status }
    }));
  }

  public getSourceStatus(id: number): DataSourceRuntimeStatus | null {
    const activeSource = this.activeSources.get(id);
    return activeSource ? { ...activeSource.status } : null;
  }

  public getAllStatuses(): DataSourceStatus[] {
    return Array.from(this.activeSources.values()).map(source => ({
      id: source.id,
      name: source.config.name,
      isRunning: source.status.isRunning,
      lastActivity: source.lastActivity,
      recordsProcessed: source.recordsProcessed,
      errorsCount: source.errorsCount,
      lastError: source.status.lastError,
      connectionStatus: source.status.connectionStatus || 'disconnected',
    }));
  }

  public async storeDataPoint(point: any): Promise<void> {
    // This method is called by BaseDataSource instances
    const activeSource = this.activeSources.get(point.sourceId);
    if (activeSource) {
      activeSource.recordsProcessed++;
      activeSource.lastActivity = new Date();
    }
  }

  private async createSourceInstance(config: DataSourceConfig): Promise<any> {
    console.log(`🏭 Creating source instance for ${config.interface.type}/${config.protocol.type}`);
    
    try {
      // Create interface/protocol specific combinations
      const interfaceProtocolKey = `${config.interface.type}_${config.protocol.type}`;
      
      switch (interfaceProtocolKey) {
        case 'SERIAL_MODBUS_RTU':
          console.log(`🔌 Creating Serial Modbus RTU source for: ${config.name}`);
          return this.createSerialModbusSource(config);
        
        case 'TCP_MODBUS_TCP':
          console.log(`🌐 Creating TCP Modbus TCP source for: ${config.name}`);
          return this.createTcpModbusSource(config);
        
        case 'TCP_MQTT':
          console.log(`📨 Creating TCP MQTT source for: ${config.name}`);
          return this.createTcpMqttSource(config);
        
        case 'SERIAL_NMEA_0183':
          console.log(`🛰️ Creating Serial NMEA source for: ${config.name}`);
          return this.createSerialNmeaSource(config);
        
        case 'TCP_API_REST':
          console.log(`📡 Creating TCP API REST source for: ${config.name}`);
          return this.createTcpApiSource(config);
        
        case 'TCP_OPC_UA':
          console.log(`🏭 Creating TCP OPC UA source for: ${config.name}`);
          return this.createTcpOpcUaSource(config);
        
        case 'FILE_API_REST':
          console.log(`📁 Creating File API source for: ${config.name}`);
          return this.createFileApiSource(config);
        
        case 'UDP_NMEA_0183':
          console.log(`📡 Creating UDP NMEA source for: ${config.name}`);
          return this.createUdpNmeaSource(config);

        // Legacy support - map old protocols to new structure
        default:
          // Try to handle legacy configurations
          console.log(`⚠️ Using legacy compatibility mode for: ${interfaceProtocolKey}`);
          return this.createLegacySource(config);
      }
    } catch (error) {
      console.error(`❌ Error creating source instance for ${config.interface.type}/${config.protocol.type}:`, error);
      
      // Check if it's a module import error
      if (error instanceof Error && error.message.includes('Cannot find module')) {
        console.error(`   💡 Tip: Make sure all required npm packages are installed`);
        console.error(`   💡 Try running: npm install mqtt modbus-serial serialport @serialport/parser-readline`);
      }
      
      throw error;
    }
  }

  // Helper methods for creating specific interface/protocol combinations
  private async createSerialModbusSource(config: DataSourceConfig) {
    const combinedConfig = this.combineConfigs(config);
    return createModbusSource(combinedConfig);
  }

  private async createTcpModbusSource(config: DataSourceConfig) {
    const combinedConfig = this.combineConfigs(config);
    return createModbusSource(combinedConfig);
  }

  private async createTcpMqttSource(config: DataSourceConfig) {
    const combinedConfig = this.combineConfigs(config);
    return createMqttSource(combinedConfig);
  }

  private async createSerialNmeaSource(config: DataSourceConfig) {
    const combinedConfig = this.combineConfigs(config);
    return createSerialSource(combinedConfig);
  }

  private async createTcpApiSource(config: DataSourceConfig) {
    const combinedConfig = this.combineConfigs(config);
    return createApiSource(combinedConfig);
  }

  private async createTcpOpcUaSource(config: DataSourceConfig) {
    // For now, create a placeholder - you'll need to implement OPC UA source
    const combinedConfig = this.combineConfigs(config);
    console.log(`⚠️ OPC UA source not yet implemented, using TCP source as placeholder`);
    return createTcpSource(combinedConfig);
  }

  private async createFileApiSource(config: DataSourceConfig) {
    const combinedConfig = this.combineConfigs(config);
    return createFileSource(combinedConfig);
  }

  private async createUdpNmeaSource(config: DataSourceConfig) {
    const combinedConfig = this.combineConfigs(config);
    return createUdpSource(combinedConfig);
  }

  private async createLegacySource(config: DataSourceConfig) {
    const combinedConfig = this.combineConfigs(config);
    
    // Try to determine the appropriate source based on protocol type
    switch (config.protocol.type) {
      case 'API_REST':
        return createApiSource(combinedConfig);
      case 'MQTT':
        return createMqttSource(combinedConfig);
      case 'MODBUS_TCP':
      case 'MODBUS_RTU':
        return createModbusSource(combinedConfig);
      case 'NMEA_0183':
        return createSerialSource(combinedConfig);
      default:
        // Fallback based on interface type
        switch (config.interface.type) {
          case 'TCP':
            return createTcpSource(combinedConfig);
          case 'UDP':
            return createUdpSource(combinedConfig);
          case 'SERIAL':
            return createSerialSource(combinedConfig);
          case 'FILE':
            return createFileSource(combinedConfig);
          default:
            throw new Error(`Unable to create legacy source for ${config.interface.type}/${config.protocol.type}`);
        }
    }
  }

  // FIXED: Type-safe conversion utilities
  private toNumber(value: any, defaultValue: number): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  }

  private toString(value: any, defaultValue: string = ''): string {
    if (typeof value === 'string') return value;
    if (value !== null && value !== undefined) return String(value);
    return defaultValue;
  }

  private toBoolean(value: any, defaultValue: boolean = false): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lowered = value.toLowerCase();
      return lowered === 'true' || lowered === '1' || lowered === 'yes';
    }
    if (typeof value === 'number') return value !== 0;
    return defaultValue;
  }

  // FIXED: Type-safe config normalization
  private normalizeConfig(config: MergedConfig): MergedConfig {
    const normalized: MergedConfig = { ...config };

    // Normalize numeric fields
    if (normalized.port !== undefined) {
      normalized.port = this.toNumber(normalized.port, 80);
    }
    if (normalized.tcpPort !== undefined) {
      normalized.tcpPort = this.toNumber(normalized.tcpPort, 80);
    }
    if (normalized.serverPort !== undefined) {
      normalized.serverPort = this.toNumber(normalized.serverPort, 80);
    }
    if (normalized.timeout !== undefined) {
      normalized.timeout = this.toNumber(normalized.timeout, 5000);
    }
    if (normalized.connectionTimeout !== undefined) {
      normalized.connectionTimeout = this.toNumber(normalized.connectionTimeout, 5000);
    }
    if (normalized.unitId !== undefined) {
      normalized.unitId = this.toNumber(normalized.unitId, 1);
    }
    if (normalized.slaveId !== undefined) {
      normalized.slaveId = this.toNumber(normalized.slaveId, 1);
    }
    if (normalized.pollInterval !== undefined) {
      normalized.pollInterval = this.toNumber(normalized.pollInterval, 1000);
    }
    if (normalized.maxRetries !== undefined) {
      normalized.maxRetries = this.toNumber(normalized.maxRetries, 3);
    }

    // Normalize string fields
    if (normalized.endpoint !== undefined) {
      normalized.endpoint = this.toString(normalized.endpoint);
    }
    if (normalized.url !== undefined) {
      normalized.url = this.toString(normalized.url);
    }
    if (normalized.brokerUrl !== undefined) {
      normalized.brokerUrl = this.toString(normalized.brokerUrl);
    }
    if (normalized.host !== undefined) {
      normalized.host = this.toString(normalized.host);
    }
    if (normalized.hostname !== undefined) {
      normalized.hostname = this.toString(normalized.hostname);
    }
    if (normalized.method !== undefined) {
      normalized.method = this.toString(normalized.method, 'GET');
    }

    // Normalize boolean fields
    if (normalized.secure !== undefined) {
      normalized.secure = this.toBoolean(normalized.secure, false);
    }

    return normalized;
  }

  // CRITICAL FIX: Type-safe config combination with proper normalization
  private combineConfigs(config: DataSourceConfig): any {
    // Start with a base merged config using type-safe access
    let mergedConfig: MergedConfig = {
      ...config.interface.config,
      ...config.protocol.config,
      ...config.dataSource.customConfig,
    };

    // FIXED: Normalize all config values to ensure correct types
    mergedConfig = this.normalizeConfig(mergedConfig);

    // SPECIFIC FIXES for TCP/MODBUS_TCP combinations using safe property access
    if (config.interface.type === 'TCP') {
      // Ensure TCP sources have required fields with sensible defaults
      if (!mergedConfig.host && !mergedConfig.hostname) {
        mergedConfig.host = mergedConfig.host || mergedConfig.hostname || 'localhost';
      }
      
      // CRITICAL: Ensure port is always present for TCP connections as a NUMBER
      if (!mergedConfig.port && !mergedConfig.tcpPort && !mergedConfig.serverPort) {
        // Set default ports based on protocol
        if (config.protocol.type === 'MODBUS_TCP') {
          mergedConfig.port = 502;
        } else if (config.protocol.type === 'MQTT') {
          mergedConfig.port = 1883;
        } else if (config.protocol.type === 'OPC_UA') {
          mergedConfig.port = 4840;
        } else if (config.protocol.type === 'API_REST' || config.protocol.type === 'API_SOAP') {
          mergedConfig.port = mergedConfig.secure ? 443 : 80;
        } else {
          mergedConfig.port = 80; // Default fallback
        }
      }
      
      if (!mergedConfig.timeout && !mergedConfig.connectionTimeout) {
        mergedConfig.timeout = mergedConfig.timeout || mergedConfig.connectionTimeout || 5000;
      }
    }

    // MODBUS protocol specific defaults with safe property access
    if (config.protocol.type === 'MODBUS_TCP' || config.protocol.type === 'MODBUS_RTU') {
      // Ensure Modbus sources have required fields
      if (!mergedConfig.unitId && !mergedConfig.slaveId) {
        mergedConfig.unitId = mergedConfig.unitId || mergedConfig.slaveId || 1;
      }
      
      if (!mergedConfig.pollInterval) {
        mergedConfig.pollInterval = mergedConfig.pollInterval || 1000;
      }
      
      if (!mergedConfig.maxRetries) {
        mergedConfig.maxRetries = mergedConfig.maxRetries || 3;
      }

      // Ensure registers array exists
      if (!mergedConfig.registers) {
        mergedConfig.registers = [
          {
            address: 40001,
            type: 'holding',
            length: 1,
            tagName: 'default_register',
            dataType: 'uint16'
          }
        ];
      }
    }

    // MQTT protocol specific defaults with safe property access
    if (config.protocol.type === 'MQTT') {
      if (!mergedConfig.brokerUrl && mergedConfig.host) {
        const protocol = mergedConfig.secure ? 'mqtts' : 'mqtt';
        const port = mergedConfig.port || (mergedConfig.secure ? 8883 : 1883);
        mergedConfig.brokerUrl = `${protocol}://${mergedConfig.host}:${port}`;
      }
      
      if (!mergedConfig.topics) {
        mergedConfig.topics = ['sensors/+/data'];
      }
    }

    // API protocol specific defaults with safe property access
    if (config.protocol.type === 'API_REST' || config.protocol.type === 'API_SOAP') {
      if (!mergedConfig.endpoint && !mergedConfig.url) {
        const protocol = mergedConfig.secure || mergedConfig.port === 443 ? 'https' : 'http';
        const host = mergedConfig.host || 'localhost';
        const port = mergedConfig.port && mergedConfig.port !== 80 && mergedConfig.port !== 443 ? `:${mergedConfig.port}` : '';
        mergedConfig.endpoint = mergedConfig.endpoint || mergedConfig.url || `${protocol}://${host}${port}`;
      }
      
      if (!mergedConfig.method) {
        mergedConfig.method = 'GET';
      }
      
      if (!mergedConfig.pollInterval) {
        mergedConfig.pollInterval = 10000;
      }
    }

    console.log(`🔧 Combined config for ${config.name}:`, JSON.stringify(mergedConfig, null, 2));

    // Return the legacy format that data sources expect
    return {
      id: config.id,
      name: config.name,
      type: config.interface.type,
      protocol: config.protocol.type,
      config: mergedConfig, // This is what legacy sources expect to access via this.config.config
      isActive: config.isActive,
      userId: config.userId,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }

  private startStatsCollection(): void {
    console.log('📊 Starting stats collection...');
    this.statsInterval = setInterval(() => {
      // Update statistics for all active sources
      for (const [id, source] of this.activeSources) {
        if (source.status.isRunning) {
          this.emit('sourceStats', {
            id,
            recordsProcessed: source.recordsProcessed,
            errorsCount: source.errorsCount,
            lastActivity: source.lastActivity,
          });
        }
      }
    }, 5000); // Update every 5 seconds
  }

  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Data Source Manager...');
    
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    // Stop all active sources
    const stopPromises = Array.from(this.activeSources.keys()).map(id => {
      return this.stopSource(id).catch(error => {
        console.error(`❌ Error stopping source ${id}:`, error);
      });
    });

    await Promise.all(stopPromises);
    this.activeSources.clear();
    this.removeAllListeners();
    this.isInitialized = false;
    
    console.log('✅ Data Source Manager shutdown complete');
  }

  // Debug method to get detailed status
  public getDebugInfo(): any {
    return {
      isInitialized: this.isInitialized,
      activeSourcesCount: this.activeSources.size,
      activeSources: Array.from(this.activeSources.entries()).map(([id, source]) => ({
        id,
        name: source.config.name,
        interface: source.config.interface.type,
        protocol: source.config.protocol.type,
        dataSourceType: source.config.dataSource.type,
        status: source.status,
        recordsProcessed: source.recordsProcessed,
        errorsCount: source.errorsCount,
        lastActivity: source.lastActivity,
        configSummary: {
          interfaceConfig: Object.keys(source.config.interface.config || {}),
          protocolConfig: Object.keys(source.config.protocol.config || {}),
          customConfig: Object.keys(source.config.dataSource.customConfig || {}),
        }
      })),
    };
  }
}
