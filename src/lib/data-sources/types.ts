// src/lib/data-sources/types.ts

// Interface types - Physical/Communication layer
export type InterfaceType =
  | 'SERIAL'
  | 'TCP' 
  | 'UDP'
  | 'USB'
  | 'FILE';

// Protocol types - Data communication standards
export type ProtocolType =
  | 'MODBUS_RTU'
  | 'MODBUS_TCP'
  | 'OPC_UA'
  | 'OSI_PI'
  | 'MQTT'
  | 'NMEA_0183'
  | 'HART'
  | 'ANALOG_4_20MA'
  | 'ANALOG_0_5V'
  | 'API_REST'
  | 'API_SOAP';

// Data source types - Device/Instrument types
export type DataSourceType =
  | 'PLC'
  | 'HMI'
  | 'SENSOR_NETWORK'
  | 'WEATHER_STATION'
  | 'GPS_TRACKER'
  | 'FLOW_METER'
  | 'TEMPERATURE_SENSOR'
  | 'PRESSURE_TRANSMITTER'
  | 'LEVEL_SENSOR'
  | 'VIBRATION_MONITOR'
  | 'GAS_DETECTOR'
  | 'WATER_QUALITY_SENSOR'
  | 'POWER_METER'
  | 'HISTORIAN_SERVER'
  | 'SCADA_SYSTEM'
  | 'CUSTOM';

// Interface-specific configurations
export interface SerialInterfaceConfig {
  port: string;
  baudRate: number;
  dataBits: 5 | 6 | 7 | 8;
  stopBits: 1 | 2;
  parity: 'none' | 'even' | 'odd';
  flowControl: 'none' | 'hardware' | 'software';
  timeout: number;
}

export interface TcpInterfaceConfig {
  host: string;
  port: number;
  timeout: number;
  keepAlive: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export interface UdpInterfaceConfig {
  port: number;
  host?: string;
  timeout: number;
  bufferSize: number;
}

export interface UsbInterfaceConfig {
  vendorId: string;
  productId: string;
  endpoint: number;
  timeout: number;
}

export interface FileInterfaceConfig {
  path: string;
  watchMode: boolean;
  pollInterval: number;
  encoding: 'utf8' | 'ascii' | 'binary';
  delimiter?: string;
}

// Protocol-specific configurations
export interface ModbusRtuProtocolConfig {
  unitId: number;
  registers: Array<{
    address: number;
    type: 'holding' | 'input' | 'coil' | 'discrete';
    length: number;
    tagName: string;
    scalingFactor?: number;
    offset?: number;
    dataType: 'int16' | 'uint16' | 'int32' | 'uint32' | 'float32' | 'boolean';
  }>;
  pollInterval: number;
  maxRetries: number;
}

export interface ModbusTcpProtocolConfig {
  unitId: number;
  registers: Array<{
    address: number;
    type: 'holding' | 'input' | 'coil' | 'discrete';
    length: number;
    tagName: string;
    scalingFactor?: number;
    offset?: number;
    dataType: 'int16' | 'uint16' | 'int32' | 'uint32' | 'float32' | 'boolean';
  }>;
  pollInterval: number;
  maxRetries: number;
}

export interface OpcUaProtocolConfig {
  endpointUrl: string;
  securityMode: 'None' | 'Sign' | 'SignAndEncrypt';
  securityPolicy: 'None' | 'Basic128Rsa15' | 'Basic256' | 'Basic256Sha256';
  username?: string;
  password?: string;
  certificatePath?: string;
  privateKeyPath?: string;
  nodes: Array<{
    nodeId: string;
    tagName: string;
    dataType?: string;
  }>;
  subscriptionInterval: number;
}

export interface MqttProtocolConfig {
  brokerUrl: string;
  clientId?: string;
  username?: string;
  password?: string;
  topics: Array<{
    topic: string;
    qos: 0 | 1 | 2;
    tagMapping?: string;
  }>;
  keepAlive: number;
  cleanSession: boolean;
}

export interface NmeaProtocolConfig {
  sentences: string[];
  parseGps: boolean;
  parseWeather: boolean;
  customParsers?: Array<{
    sentence: string;
    fields: Array<{
      name: string;
      type: 'string' | 'number' | 'boolean';
      unit?: string;
    }>;
  }>;
}

export interface HartProtocolConfig {
  deviceAddress: number;
  commands: Array<{
    commandNumber: number;
    tagName: string;
    pollInterval: number;
    dataType: 'float' | 'integer' | 'string';
    unit?: string;
  }>;
  maxRetries: number;
}

export interface AnalogProtocolConfig {
  channels: Array<{
    channel: number;
    tagName: string;
    rangeMin: number;
    rangeMax: number;
    scalingMin: number;
    scalingMax: number;
    unit: string;
    samplingRate: number;
  }>;
  samplingMode: 'continuous' | 'triggered';
}

export interface ApiProtocolConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'apikey' | 'oauth2';
    credentials?: Record<string, string>;
  };
  requestBody?: string;
  responseMapping: Array<{
    jsonPath: string;
    tagName: string;
    dataType: 'string' | 'number' | 'boolean';
    unit?: string;
  }>;
  pollInterval: number;
  timeout: number;
}

// Data source templates
export interface DataSourceTemplate {
  id: string;
  name: string;
  description: string;
  manufacturer?: string;
  model?: string;
  type: DataSourceType;
  supportedInterfaces: InterfaceType[];
  supportedProtocols: ProtocolType[];
  defaultConfig: {
    interface?: Partial<SerialInterfaceConfig | TcpInterfaceConfig | UdpInterfaceConfig | UsbInterfaceConfig | FileInterfaceConfig>;
    protocol?: Partial<ModbusRtuProtocolConfig | ModbusTcpProtocolConfig | OpcUaProtocolConfig | MqttProtocolConfig | NmeaProtocolConfig | HartProtocolConfig | AnalogProtocolConfig | ApiProtocolConfig>;
  };
  documentation?: string;
  icon?: string;
}

// Main configuration structure
export interface DataSourceConfig {
  id: number;
  name: string;
  description?: string;
  interface: {
    type: InterfaceType;
    config: SerialInterfaceConfig | TcpInterfaceConfig | UdpInterfaceConfig | UsbInterfaceConfig | FileInterfaceConfig;
  };
  protocol: {
    type: ProtocolType;
    config: ModbusRtuProtocolConfig | ModbusTcpProtocolConfig | OpcUaProtocolConfig | MqttProtocolConfig | NmeaProtocolConfig | HartProtocolConfig | AnalogProtocolConfig | ApiProtocolConfig;
  };
  dataSource: {
    type: DataSourceType;
    templateId?: string;
    customConfig?: Record<string, any>;
  };
  isActive: boolean;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  runtimeStatus?: DataSourceRuntimeStatus;
}

// Runtime status (unchanged)
export interface DataSourceRuntimeStatus {
  isRunning: boolean;
  lastError?: string;
  lastActivity?: Date;
  recordsProcessed?: number;
  connectionStatus?: 'connected' | 'disconnected' | 'connecting' | 'error';
}

// Data point structure (unchanged)
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

// Status interface (unchanged)
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

// Quality codes (unchanged)
export enum DataQuality {
  GOOD = 192,
  UNCERTAIN = 64,
  BAD = 0,
}
