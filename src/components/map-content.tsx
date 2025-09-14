'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Wifi, WifiOff, Activity, Trash2, Settings, Power } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import 'leaflet/dist/leaflet.css';

interface DataSource {
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
}

interface MapContentProps {
  dataSources: DataSource[];
  onMapClick: (lat: number, lng: number) => void;
  onDataSourceClick: (dataSource: DataSource) => void;
  onDeleteDataSource?: (sourceId: number) => void;
  onToggleActive?: (sourceId: number, isActive: boolean) => void;
}

// Map click handler component
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Create custom marker icon
const createCustomIcon = (color: string, isActive: boolean) => {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
        <circle cx="12" cy="12" r="10" fill="${isActive ? color : '#6b7280'}" stroke="#fff" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="#fff"/>
        ${isActive ? '<circle cx="12" cy="12" r="2" fill="#00ff00"/>' : '<circle cx="12" cy="12" r="2" fill="#ef4444"/>'}
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'connected': return '#22c55e';
    case 'connecting': return '#f59e0b';
    case 'error': return '#ef4444';
    default: return '#6b7280';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'connected': return <Wifi className="h-4 w-4" />;
    case 'connecting': return <Activity className="h-4 w-4 animate-pulse" />;
    case 'error': return <WifiOff className="h-4 w-4" />;
    default: return <WifiOff className="h-4 w-4" />;
  }
};

export default function MapContent({ 
  dataSources, 
  onMapClick, 
  onDataSourceClick,
  onDeleteDataSource,
  onToggleActive 
}: MapContentProps) {
  // Calculate map center based on data sources or default to Houston
  const getMapCenter = (): [number, number] => {
    const sourcesWithCoords = dataSources.filter(s => s.latitude && s.longitude);
    if (sourcesWithCoords.length === 0) {
      return [29.7604, -95.3698]; // Houston default
    }
    
    const avgLat = sourcesWithCoords.reduce((sum, s) => sum + s.latitude!, 0) / sourcesWithCoords.length;
    const avgLng = sourcesWithCoords.reduce((sum, s) => sum + s.longitude!, 0) / sourcesWithCoords.length;
    
    return [avgLat, avgLng];
  };

  const mapCenter = getMapCenter();

  return (
    <MapContainer
      center={mapCenter}
      zoom={dataSources.length > 1 ? 3 : 10}
      className="w-full h-full rounded-lg z-0"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapClickHandler onMapClick={onMapClick} />

      {dataSources
        .filter(source => source.latitude && source.longitude)
        .map((source) => (
          <Marker
            key={source.id}
            position={[source.latitude!, source.longitude!]}
            icon={createCustomIcon(getStatusColor(source.connectionStatus), source.isActive)}
            eventHandlers={{
              click: () => onDataSourceClick(source),
            }}
          >
            <Popup className="custom-popup">
              <Card className="border-0 shadow-none min-w-[280px] max-w-[320px]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{source.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={source.isActive ? "default" : "secondary"}>
                        {source.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Badge 
                        variant={
                          source.connectionStatus === 'connected' ? "default" :
                          source.connectionStatus === 'error' ? "destructive" : "secondary"
                        }
                      >
                        {getStatusIcon(source.connectionStatus)}
                        <span className="ml-1 capitalize">{source.connectionStatus}</span>
                      </Badge>
                    </div>
                  </div>
                  {source.description && (
                    <p className="text-xs text-muted-foreground">{source.description}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Interface:</span>
                      <p className="font-medium">{source.interfaceType}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Protocol:</span>
                      <p className="font-medium">{source.protocolType}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="font-medium">{source.dataSourceType}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ID:</span>
                      <p className="font-mono text-xs">{source.id}</p>
                    </div>
                  </div>
                  
                  <div className="text-xs">
                    <span className="text-muted-foreground">Location:</span>
                    <p className="font-mono text-xs">
                      {source.latitude?.toFixed(4)}, {source.longitude?.toFixed(4)}
                    </p>
                  </div>

                  {source.lastUpdated && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <p className="text-xs">
                        {new Date(source.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {onToggleActive && (
                        <Button
                          size="sm"
                          variant={source.isActive ? "destructive" : "default"}
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleActive(source.id, source.isActive);
                          }}
                        >
                          <Power className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Add settings/edit functionality here
                          console.log('Edit source:', source.id);
                        }}
                      >
                        <Settings className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {onDeleteDataSource && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDataSource(source.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
