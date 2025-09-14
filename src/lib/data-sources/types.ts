// src/lib/data-sources/types.ts

export type DataSourceType =
  | 'SERIAL'
  | 'USB'
  | 'FILE'
  | 'TCP'
  | 'UDP'
  | 'API'
  | 'MODBUS'
  | 'MQTT';

export type ProtocolType =
  | 'MODBUS'
  | 'MQTT'
  | 'NMEA'
  | 'HART'
  | 'OPC'
  | 'OSI_PI'
  | 'ANALOG_4_20mA'
  | 'ANALOG_0_5V'
  | 'API'
  | 'FILE'
  | 'SERIAL'
  | 'TCP'
  | 'UDP';

export interface DataSourceRuntimeStatus {
  isRunning: boolean;
  lastError?: string;
  lastActivity?: Date;
  recordsProcessed?: number;
  connectionStatus?: 'connected' | 'disconnected' | 'connecting' | 'error';
}

export interface DataSourceConfig {
  id: number;
  name: string;
  type: DataSourceType;
  protocol: ProtocolType;
  config: Record<string, any>;
  isActive: boolean;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  runtimeStatus?: DataSourceRuntimeStatus;
}

// Protocol-specific configuration interfaces
export interface ModbusConfig {
  host: string;
  port: number;
  unitId: number;
  timeout?: number;
  retries?: number;
  reconnectInterval?: number;
  pollInterval?: number;
  registers?: Array<{
    address: number;
    type: 'holding' | 'input' | 'coil' | 'discrete';
    length: number;
    tagName: string;
  }>;
}

export interface MqttConfig {
  brokerUrl: string;
  clientId?: string;
  username?: string;
  password?: string;
  topics: string[];
  qos?: 0 | 1 | 2;
  cleanSession?: boolean;
  keepAlive?: number;
}

export interface NmeaConfig {
  port: string;
  baudRate: number;
  dataBits?: 5 | 6 | 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
  sentences?: string[]; // Filter specific NMEA sentences
}

export interface OpcConfig {
  serverUrl: string;
  securityMode: 'None' | 'Sign' | 'SignAndEncrypt';
  securityPolicy: string;
  username?: string;
  password?: string;
  nodes?: Array<{
    nodeId: string;
    tagName: string;
    dataType?: string;
  }>;
}

export interface AnalogConfig {
  channels: Array<{
    channel: number;
    tagName: string;
    scalingFactor?: number;
    offset?: number;
    units?: string;
  }>;
}

export interface TcpConfig {
  host: string;
  port: number;
  protocol?: 'tcp' | 'udp';
  timeout?: number;
  reconnectInterval?: number;
  messageFormat?: 'json' | 'csv' | 'binary' | 'custom';
  delimiter?: string;
}

export interface UdpConfig {
  port: number;
  host?: string;
  timeout?: number;
  messageFormat?: 'json' | 'csv' | 'binary' | 'custom';
  delimiter?: string;
}

export interface FileConfig {
  path: string;
  format: 'csv' | 'json' | 'xml' | 'binary' | 'text';
  watchMode?: boolean;
  pollInterval?: number;
  headers?: string[];
  delimiter?: string;
  skipLines?: number;
}

export interface ApiConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'apikey';
    credentials?: {
      username?: string;
      password?: string;
      token?: string;
      apiKey?: string;
      apiKeyHeader?: string;
    };
  };
  pollInterval?: number;
  responseFormat?: 'json' | 'xml' | 'csv';
  dataPath?: string; // JSON path to extract data
}

export interface SerialConfig {
  port: string;
  baudRate: number;
  dataBits?: 5 | 6 | 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
  sentences?: string[]; // For NMEA protocol
}

// Union type for all possible configurations
export type DataSourceProtocolConfig =
  | ModbusConfig
  | MqttConfig
  | NmeaConfig
  | OpcConfig
  | AnalogConfig
  | TcpConfig
  | UdpConfig
  | FileConfig
  | ApiConfig
  | SerialConfig;

// Data point structure
export interface DataPoint {
  id?: number;
  sourceId: number;
  tagName: string;
  value: any;
  quality: number;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  metadata?: Record<string, any>;
}

// Quality codes (following OPC standards)
export enum DataQuality {
  GOOD = 192,
  UNCERTAIN = 64,
  BAD = 0,
}

// Data source status for monitoring
export interface DataSourceStatus {
  id: number;
  name: string;
  isRunning: boolean;
  lastActivity?: Date;
  recordsProcessed: number;
  errorsCount: number;
  lastError?: string;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  throughput?: {
    recordsPerSecond: number;
    bytesPerSecond: number;
  };
}
