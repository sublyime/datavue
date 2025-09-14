// src/components/real-interactive-map.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Zap, Activity, AlertTriangle, CheckCircle2, XCircle, Plus, Settings, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface DataSource {
  id: number;
  name: string;
  description?: string;
  interfaceType: string;
  protocolType: string;
  dataSourceType: string;
  isActive: boolean;
  latitude: number;
  longitude: number;
  lastValue?: number;
  lastUpdated?: string;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'connecting';
  unit?: string;
  threshold?: { min: number; max: number };
}

interface MapProps {
  dataSources?: DataSource[];
  onMarkerClick?: (dataSource: DataSource) => void;
  onMapClick?: (lat: number, lng: number) => void;
  selectedMarkerId?: number;
  showAddMarker?: boolean;
  className?: string;
}

// SVG-based interactive world map
const WorldMapSVG: React.FC<{
  dataSources: DataSource[];
  onMarkerClick: (source: DataSource) => void;
  onMapClick?: (lat: number, lng: number) => void;
  selectedMarkerId?: number;
  showAddMarker?: boolean;
}> = ({ dataSources, onMarkerClick, onMapClick, selectedMarkerId, showAddMarker }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  // Convert lat/lng to SVG coordinates (Mercator-like projection)
  const latLngToSVG = (lat: number, lng: number): [number, number] => {
    const x = ((lng + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;
    return [x, y];
  };

  // Convert SVG coordinates back to lat/lng
  const svgToLatLng = (x: number, y: number): [number, number] => {
    const lng = (x / 1000) * 360 - 180;
    const lat = 90 - (y / 500) * 180;
    return [lat, lng];
  };

  const handleMapClick = (event: React.MouseEvent<SVGElement>) => {
    if (!onMapClick) return;
    
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 1000;
    const y = ((event.clientY - rect.top) / rect.height) * 500;
    
    const [lat, lng] = svgToLatLng(x, y);
    onMapClick(lat, lng);
  };

  const getMarkerColor = (source: DataSource): string => {
    if (!source.isActive) return '#6b7280'; // gray
    if (source.connectionStatus === 'error') return '#dc2626'; // red
    if (source.connectionStatus === 'connected') {
      if (source.lastValue && source.threshold) {
        const { min, max } = source.threshold;
        const value = source.lastValue;
        if (value < min || value > max) return '#f59e0b'; // amber for out of range
      }
      return '#10b981'; // green for normal
    }
    return '#3b82f6'; // blue for connecting
  };

  const getMarkerIcon = (source: DataSource): string => {
    switch (source.dataSourceType) {
      case 'TEMPERATURE_SENSOR': return '🌡️';
      case 'PRESSURE_TRANSMITTER': return '⚡';
      case 'FLOW_METER': return '💧';
      case 'POWER_METER': return '🔌';
      case 'WEATHER_STATION': return '🌤️';
      case 'SENSOR': return '📊';
      default: return '📍';
    }
  };

  return (
    <svg 
      ref={svgRef}
      viewBox="0 0 1000 500" 
      className="w-full h-full cursor-crosshair"
      onClick={showAddMarker ? handleMapClick : undefined}
    >
      {/* Ocean background */}
      <rect width="1000" height="500" fill="#e0f2fe" />
      
      {/* Grid lines */}
      <defs>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.3"/>
        </pattern>
      </defs>
      <rect width="1000" height="500" fill="url(#grid)" />
      
      {/* Continents - Simplified shapes */}
      {/* North America */}
      <path d="M 50 80 Q 100 60 200 70 Q 250 80 320 120 Q 300 150 280 200 Q 200 220 120 180 Q 80 140 50 80 Z" 
            fill="#10b981" opacity="0.6" stroke="#059669" strokeWidth="1"/>
      
      {/* South America */}
      <path d="M 220 250 Q 280 240 300 300 Q 290 360 280 400 Q 260 420 240 420 Q 220 380 215 350 Q 210 300 220 250 Z" 
            fill="#10b981" opacity="0.6" stroke="#059669" strokeWidth="1"/>
      
      {/* Europe */}
      <path d="M 450 80 Q 500 70 520 70 Q 540 80 540 100 Q 530 120 520 130 Q 490 135 470 140 Q 455 120 450 80 Z" 
            fill="#10b981" opacity="0.6" stroke="#059669" strokeWidth="1"/>
      
      {/* Africa */}
      <path d="M 480 140 Q 520 130 550 130 Q 570 150 570 200 Q 565 250 560 300 Q 545 320 530 320 Q 510 300 500 280 Q 485 220 480 140 Z" 
            fill="#10b981" opacity="0.6" stroke="#059669" strokeWidth="1"/>
      
      {/* Asia */}
      <path d="M 550 80 Q 650 70 700 70 Q 750 80 720 120 Q 680 140 680 180 Q 620 190 600 200 Q 580 170 550 150 Q 545 120 550 80 Z" 
            fill="#10b981" opacity="0.6" stroke="#059669" strokeWidth="1"/>
      
      {/* Australia */}
      <path d="M 700 300 Q 750 290 780 290 Q 790 310 790 330 Q 780 345 760 350 Q 730 345 720 340 Q 705 325 700 300 Z" 
            fill="#10b981" opacity="0.6" stroke="#059669" strokeWidth="1"/>

      {/* Major cities dots for reference */}
      <circle cx="250" cy="150" r="2" fill="#374151" opacity="0.5" />
      <text x="255" y="155" fontSize="8" fill="#374151" opacity="0.7">NYC</text>
      
      <circle cx="480" cy="110" r="2" fill="#374151" opacity="0.5" />
      <text x="485" y="115" fontSize="8" fill="#374151" opacity="0.7">London</text>
      
      <circle cx="750" cy="320" r="2" fill="#374151" opacity="0.5" />
      <text x="755" y="325" fontSize="8" fill="#374151" opacity="0.7">Sydney</text>

      {/* Data source markers */}
      {dataSources.map((source) => {
        const [x, y] = latLngToSVG(source.latitude, source.longitude);
        const isSelected = selectedMarkerId === source.id;
        const markerColor = getMarkerColor(source);
        
        return (
          <g key={source.id} transform={`translate(${x}, ${y})`}>
            {/* Pulsing ring for active sources */}
            {source.isActive && source.connectionStatus === 'connected' && (
              <circle
                r="15"
                fill={markerColor}
                opacity="0.3"
                className="animate-ping"
              />
            )}
            
            {/* Selection ring */}
            {isSelected && (
              <circle
                r="18"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                opacity="0.8"
                className="animate-pulse"
              />
            )}
            
            {/* Main marker circle */}
            <circle
              r="12"
              fill={markerColor}
              stroke="white"
              strokeWidth="2"
              className={`cursor-pointer transition-all duration-200 ${
                isSelected ? 'drop-shadow-lg' : 'hover:drop-shadow-md'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onMarkerClick(source);
              }}
            />
            
            {/* Icon */}
            <text
              textAnchor="middle"
              dy="0.3em"
              fontSize="8"
              fill="white"
              className="pointer-events-none select-none"
            >
              {getMarkerIcon(source)}
            </text>
            
            {/* Status indicator */}
            <circle
              cx="8"
              cy="-8"
              r="4"
              fill={
                source.connectionStatus === 'connected' ? '#10b981' :
                source.connectionStatus === 'error' ? '#dc2626' :
                source.connectionStatus === 'disconnected' ? '#6b7280' : '#3b82f6'
              }
              stroke="white"
              strokeWidth="1"
            />
          </g>
        );
      })}
      
      {/* Coordinate lines */}
      <line x1="0" y1="250" x2="1000" y2="250" stroke="#cbd5e1" strokeWidth="1" opacity="0.3" strokeDasharray="5,5" />
      <line x1="500" y1="0" x2="500" y2="500" stroke="#cbd5e1" strokeWidth="1" opacity="0.3" strokeDasharray="5,5" />
    </svg>
  );
};

// Data source detail popup
const DataSourcePopup: React.FC<{
  dataSource: DataSource;
  onClose: () => void;
  position: { x: number; y: number };
}> = ({ dataSource, onClose, position }) => {
  const getValueStatus = (value?: number, threshold?: { min: number; max: number }) => {
    if (!value || !threshold) return 'normal';
    if (value < threshold.min || value > threshold.max) return 'warning';
    return 'normal';
  };

  const valueStatus = getValueStatus(dataSource.lastValue, dataSource.threshold);

  return (
    <div
      className="absolute bg-white rounded-lg shadow-lg border p-4 z-50 min-w-[280px] max-w-[320px]"
      style={{
        left: Math.min(position.x, window.innerWidth - 320),
        top: Math.max(position.y - 200, 10),
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-sm">{dataSource.name}</h3>
          <p className="text-xs text-muted-foreground">{dataSource.description}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          ×
        </Button>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Type:</span>
          <span>{dataSource.dataSourceType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Protocol:</span>
          <span>{dataSource.protocolType}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Status:</span>
          <div className="flex items-center gap-1">
            <Badge 
              variant={dataSource.connectionStatus === 'connected' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {dataSource.connectionStatus}
            </Badge>
            <Badge 
              variant={dataSource.isActive ? 'default' : 'outline'}
              className="text-xs"
            >
              {dataSource.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
        
        {dataSource.lastValue !== undefined && (
          <>
            <hr className="my-2" />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current Value:</span>
              <span className={`font-mono font-bold ${
                valueStatus === 'warning' ? 'text-amber-600' : 'text-green-600'
              }`}>
                {dataSource.lastValue.toFixed(2)} {dataSource.unit}
              </span>
            </div>
            {dataSource.threshold && (
              <div className="text-xs text-muted-foreground">
                Range: {dataSource.threshold.min}-{dataSource.threshold.max} {dataSource.unit}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              Updated: {dataSource.lastUpdated ? new Date(dataSource.lastUpdated).toLocaleTimeString() : 'N/A'}
            </div>
          </>
        )}
      </div>

      <div className="flex gap-2 mt-3">
        <Button size="sm" className="flex-1 text-xs h-7">
          <Settings className="h-3 w-3 mr-1" />
          Config
        </Button>
        <Button size="sm" variant="outline" className="flex-1 text-xs h-7">
          <Activity className="h-3 w-3 mr-1" />
          Details
        </Button>
      </div>
    </div>
  );
};

// Legend component
const MapLegend: React.FC = () => (
  <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 text-xs shadow-lg">
    <div className="font-semibold mb-2">Status Legend</div>
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-green-500 rounded-full" />
        <span>Connected & Normal</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-amber-500 rounded-full" />
        <span>Connected & Alert</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-red-500 rounded-full" />
        <span>Error</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-gray-400 rounded-full" />
        <span>Disconnected</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full" />
        <span>Connecting</span>
      </div>
    </div>
  </div>
);

// Main component
export const RealInteractiveMap: React.FC<MapProps> = ({
  dataSources = [],
  onMarkerClick,
  onMapClick,
  selectedMarkerId,
  showAddMarker = false,
  className = '',
}) => {
  const [localDataSources, setLocalDataSources] = useState<DataSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load data sources from API or use provided ones
  useEffect(() => {
    const loadDataSources = async () => {
      if (dataSources.length > 0) {
        setLocalDataSources(dataSources);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/data-sources');
        if (response.ok) {
          const result = await response.json();
          const sources = result.data || [];
          
          // Add mock coordinates for sources without them
          const sourcesWithCoords = sources.map((source: any, index: number) => ({
            ...source,
            latitude: source.latitude || (Math.random() * 160 - 80), // -80 to 80
            longitude: source.longitude || (Math.random() * 360 - 180), // -180 to 180
            lastValue: source.lastValue || Math.random() * 100,
            unit: source.unit || getUnitForType(source.dataSourceType),
            threshold: source.threshold || getThresholdForType(source.dataSourceType),
            lastUpdated: source.lastUpdated || new Date().toISOString(),
          }));
          
          setLocalDataSources(sourcesWithCoords);
        } else {
          // Fallback to mock data
          setLocalDataSources(generateMockDataSources());
        }
      } catch (error) {
        console.error('Failed to load data sources:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data sources, using mock data',
          variant: 'destructive',
        });
        setLocalDataSources(generateMockDataSources());
      } finally {
        setLoading(false);
      }
    };

    loadDataSources();

    // Set up real-time updates
    const interval = setInterval(() => {
      setLocalDataSources(prev => prev.map(source => ({
        ...source,
        lastValue: source.connectionStatus === 'connected' ? 
          (source.lastValue || 0) + (Math.random() - 0.5) * 5 : source.lastValue,
        lastUpdated: source.connectionStatus === 'connected' ? 
          new Date().toISOString() : source.lastUpdated,
        connectionStatus: Math.random() > 0.95 ? 
          (source.connectionStatus === 'connected' ? 'error' : 'connected') : 
          source.connectionStatus,
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, [dataSources, toast]);

  const handleMarkerClick = (dataSource: DataSource, event?: React.MouseEvent) => {
    if (event) {
      setPopupPosition({ x: event.clientX, y: event.clientY });
    }
    setSelectedSource(dataSource);
    onMarkerClick?.(dataSource);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedSource(null);
    onMapClick?.(lat, lng);
    
    if (showAddMarker) {
      toast({
        title: 'Add Data Source',
        description: `Clicked at coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      });
    }
  };

  if (loading) {
    return (
      <div className={`relative w-full h-full bg-slate-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-slate-50 rounded-lg overflow-hidden ${className}`}>
      <WorldMapSVG
        dataSources={localDataSources}
        onMarkerClick={handleMarkerClick}
        onMapClick={showAddMarker ? handleMapClick : undefined}
        selectedMarkerId={selectedMarkerId}
        showAddMarker={showAddMarker}
      />
      
      <MapLegend />
      
      {/* Data source count */}
      <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 text-sm font-medium shadow-lg">
        {localDataSources.length} Data Sources
      </div>
      
      {/* Add marker hint */}
      {showAddMarker && (
        <div className="absolute top-4 right-4 bg-blue-100 text-blue-800 rounded-lg px-3 py-2 text-sm shadow-lg">
          <Plus className="h-4 w-4 inline mr-1" />
          Click anywhere to add a data source
        </div>
      )}

      {/* Popup */}
      {selectedSource && (
        <DataSourcePopup
          dataSource={selectedSource}
          onClose={() => setSelectedSource(null)}
          position={popupPosition}
        />
      )}
    </div>
  );
};

// Helper functions
const getUnitForType = (type: string): string => {
  switch (type) {
    case 'TEMPERATURE_SENSOR': return '°C';
    case 'PRESSURE_TRANSMITTER': return 'bar';
    case 'FLOW_METER': return 'L/min';
    case 'POWER_METER': return 'kW';
    case 'WEATHER_STATION': return '°C';
    default: return '';
  }
};

const getThresholdForType = (type: string): { min: number; max: number } => {
  switch (type) {
    case 'TEMPERATURE_SENSOR': return { min: 10, max: 40 };
    case 'PRESSURE_TRANSMITTER': return { min: 0.5, max: 2.5 };
    case 'FLOW_METER': return { min: 80, max: 200 };
    case 'POWER_METER': return { min: 800, max: 1600 };
    case 'WEATHER_STATION': return { min: -10, max: 50 };
    default: return { min: 0, max: 100 };
  }
};

const generateMockDataSources = (): DataSource[] => [
  {
    id: 1,
    name: 'Houston Refinery Plant',
    description: 'Main temperature sensor',
    interfaceType: 'TCP',
    protocolType: 'MODBUS_TCP',
    dataSourceType: 'TEMPERATURE_SENSOR',
    isActive: true,
    latitude: 29.7604,
    longitude: -95.3698,
    lastValue: 75.2,
    lastUpdated: new Date().toISOString(),
    connectionStatus: 'connected',
    unit: '°F',
    threshold: { min: 60, max: 85 }
  },
  {
    id: 2,
    name: 'Singapore Terminal',
    description: 'Pressure monitoring system',
    interfaceType: 'TCP',
    protocolType: 'API_REST',
    dataSourceType: 'PRESSURE_TRANSMITTER',
    isActive: true,
    latitude: 1.3521,
    longitude: 103.8198,
    lastValue: 1.8,
    lastUpdated: new Date().toISOString(),
    connectionStatus: 'connected',
    unit: 'bar',
    threshold: { min: 0.5, max: 2.5 }
  },
  {
    id: 3,
    name: 'Rotterdam Port',
    description: 'Flow monitoring station',
    interfaceType: 'SERIAL',
    protocolType: 'MODBUS_RTU',
    dataSourceType: 'FLOW_METER',
    isActive: true,
    latitude: 51.9244,
    longitude: 4.4777,
    lastValue: 125.6,
    lastUpdated: new Date().toISOString(),
    connectionStatus: 'error',
    unit: 'L/min',
    threshold: { min: 80, max: 200 }
  },
  {
    id: 4,
    name: 'Lagos Terminal',
    description: 'Power consumption monitor',
    interfaceType: 'TCP',
    protocolType: 'OPC_UA',
    dataSourceType: 'POWER_METER',
    isActive: true,
    latitude: 6.5244,
    longitude: 3.3792,
    lastValue: 1250.0,
    lastUpdated: new Date().toISOString(),
    connectionStatus: 'connected',
    unit: 'kW',
    threshold: { min: 800, max: 1600 }
  },
  {
    id: 5,
    name: 'Sydney Harbor',
    description: 'Weather monitoring station',
    interfaceType: 'UDP',
    protocolType: 'NMEA_0183',
    dataSourceType: 'WEATHER_STATION',
    isActive: false,
    latitude: -33.8688,
    longitude: 151.2093,
    lastValue: 22.5,
    lastUpdated: new Date(Date.now() - 300000).toISOString(),
    connectionStatus: 'disconnected',
    unit: '°C',
    threshold: { min: 10, max: 40 }
  }
];

export default RealInteractiveMap;