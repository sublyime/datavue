'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Plus, Database, Wifi, WifiOff, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

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

interface NewDataSourceDialog {
  isOpen: boolean;
  latitude: number;
  longitude: number;
}

interface InteractiveMapProps {
  dataSources: DataSource[];
  onAddDataSource: (dataSource: Partial<DataSource>) => Promise<void>;
  onDataSourceClick: (dataSource: DataSource) => void;
  className?: string;
}

// Dynamic map component that handles leaflet imports
const DynamicMap: React.ComponentType<{
  dataSources: DataSource[];
  onMapClick: (lat: number, lng: number) => void;
  onDataSourceClick: (dataSource: DataSource) => void;
}> = dynamic(
  () => import('./map-content').then((mod) => mod.MapContent),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading interactive map...</p>
        </div>
      </div>
    )
  }
);

export function InteractiveMap({ 
  dataSources, 
  onAddDataSource, 
  onDataSourceClick,
  className 
}: InteractiveMapProps) {
  const [newSourceDialog, setNewSourceDialog] = useState<NewDataSourceDialog>({
    isOpen: false,
    latitude: 0,
    longitude: 0
  });

  const [newSource, setNewSource] = useState({
    name: '',
    description: '',
    interfaceType: 'TCP',
    protocolType: 'API_REST',
    dataSourceType: 'SENSOR'
  });

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setNewSourceDialog({
      isOpen: true,
      latitude: lat,
      longitude: lng
    });
  }, []);

  const handleAddDataSource = async () => {
    try {
      await onAddDataSource({
        ...newSource,
        latitude: newSourceDialog.latitude,
        longitude: newSourceDialog.longitude,
        isActive: false,
        connectionStatus: 'disconnected'
      });
      
      setNewSourceDialog({ isOpen: false, latitude: 0, longitude: 0 });
      setNewSource({
        name: '',
        description: '',
        interfaceType: 'TCP',
        protocolType: 'API_REST',
        dataSourceType: 'SENSOR'
      });
    } catch (error) {
      console.error('Failed to add data source:', error);
    }
  };

  return (
    <div className={cn("relative w-full h-full", className)}>
      <DynamicMap
        dataSources={dataSources}
        onMapClick={handleMapClick}
        onDataSourceClick={onDataSourceClick}
      />

      {/* Add Data Source Dialog */}
      <Dialog open={newSourceDialog.isOpen} onOpenChange={(open) => 
        setNewSourceDialog(prev => ({ ...prev, isOpen: open }))
      }>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Data Source</DialogTitle>
            <DialogDescription>
              Create a new data source at coordinates ({newSourceDialog.latitude.toFixed(4)}, {newSourceDialog.longitude.toFixed(4)})
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newSource.name}
                onChange={(e) => setNewSource(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter data source name"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={newSource.description}
                onChange={(e) => setNewSource(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="interface">Interface</Label>
                <Select 
                  value={newSource.interfaceType} 
                  onValueChange={(value) => setNewSource(prev => ({ ...prev, interfaceType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TCP">TCP</SelectItem>
                    <SelectItem value="UDP">UDP</SelectItem>
                    <SelectItem value="SERIAL">Serial</SelectItem>
                    <SelectItem value="FILE">File</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="protocol">Protocol</Label>
                <Select 
                  value={newSource.protocolType} 
                  onValueChange={(value) => setNewSource(prev => ({ ...prev, protocolType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="API_REST">REST API</SelectItem>
                    <SelectItem value="MQTT">MQTT</SelectItem>
                    <SelectItem value="MODBUS_TCP">Modbus TCP</SelectItem>
                    <SelectItem value="MODBUS_RTU">Modbus RTU</SelectItem>
                    <SelectItem value="OPC_UA">OPC UA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="type">Data Source Type</Label>
              <Select 
                value={newSource.dataSourceType} 
                onValueChange={(value) => setNewSource(prev => ({ ...prev, dataSourceType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SENSOR">Sensor</SelectItem>
                  <SelectItem value="POWER_METER">Power Meter</SelectItem>
                  <SelectItem value="WEATHER_STATION">Weather Station</SelectItem>
                  <SelectItem value="PLC">PLC</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewSourceDialog(prev => ({ ...prev, isOpen: false }))}>
              Cancel
            </Button>
            <Button onClick={handleAddDataSource} disabled={!newSource.name}>
              Add Data Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
