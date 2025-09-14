export type DataSourceType = 
  | 'SERIAL' 
  | 'USB' 
  | 'FILE' 
  | 'TCP' 
  | 'UDP' 
  | 'API' 
  | 'MODBUS' 
  | 'OPC' 
  | 'MQTT' 
  | 'NMEA' 
  | 'HART' 
  | 'ANALOG';

export type ProtocolType = 
  | 'MODBUS_RTU'
  | 'MODBUS_TCP'
  | 'OPC_UA'
  | 'OPC_DA'
  | 'MQTT'
  | 'NMEA_0183'
  | 'HART'
  | 'ANALOG_4_20mA'
  | 'ANALOG_0_5V'
  | 'CUSTOM'
  | 'OSI_PI';

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
  runtimeStatus?: RuntimeStatus; // ADD THIS
}

export interface DataSourceStatus {
  isRunning: boolean;
  lastError?: string | null;
  lastActivity?: Date;
  bytesProcessed?: number;
  connected?: boolean;
  stats?: {
    pointsReceived: number;
    pointsStored: number;
    errors: number;
  };
}

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

export interface RuntimeStatus {
  isRunning: boolean;
  lastError?: string | null;
}

export interface ActiveSourceInfo {
  id: number;
  config: DataSourceConfig;
  status: DataSourceStatus;
}