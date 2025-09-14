'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Icon } from 'leaflet';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

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
  lastValue?: number;
  lastUpdated?: string;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'connecting';
}

interface MapContentProps {
  dataSources: DataSource[];
  onMapClick: (lat: number, lng: number) => void;
  onDataSourceClick: (dataSource: DataSource) => void;
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
        ${isActive ? '<circle cx="12" cy="12" r="2" fill="#00ff00"/>' : ''}
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

export function MapContent({ dataSources, onMapClick, onDataSourceClick }: MapContentProps) {
  return (
    <MapContainer
      center={[29.7604, -95.3698]} // Houston default
      zoom={4}
      className="w-full h-full rounded-lg z-0"
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapClickHandler onMapClick={onMapClick} />

      {dataSources.filter(source => source.latitude && source.longitude).map((source) => (
        <Marker
          key={source.id}
          position={[source.latitude!, source.longitude!]}
          icon={createCustomIcon(getStatusColor(source.connectionStatus), source.isActive)}
          eventHandlers={{
            click: () => onDataSourceClick(source),
          }}
        >
          <Popup>
            <Card className="border-0 shadow-none min-w-[250px]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{source.name}</CardTitle>
                  <Badge variant={source.isActive ? "default" : "secondary"}>
                    {source.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(source.connectionStatus)}
                      <span className="capitalize">{source.connectionStatus}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Protocol:</span>
                    <span>{source.interfaceType}/{source.protocolType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{source.dataSourceType}</span>
                  </div>
                  {source.lastValue !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Last Value:</span>
                      <span className="font-mono">{source.lastValue.toFixed(2)}</span>
                    </div>
                  )}
                  {source.lastUpdated && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Updated:</span>
                      <span>{new Date(source.lastUpdated).toLocaleTimeString()}</span>
                    </div>
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
