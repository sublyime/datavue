export interface DataSource {
  id: number;
  name: string;
  description?: string;
  interfaceType: string;
  protocolType: string;
  dataSourceType: string;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'connecting';
  lastUpdated?: string;
  interfaceConfig?: any;
  protocolConfig?: any;
  customConfig?: any;
  threshold?: {
    min?: number;
    max?: number;
  };
  lastValue?: number;
  unit?: string;
}
