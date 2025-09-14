'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Plus, Database, Wifi, WifiOff, Activity, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// Dynamic import for the map content to avoid SSR issues
const MapContent = dynamic(() => import('./map-content'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg">
      <div className="text-center">
        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
        <p className="text-sm text-muted-foreground">Loading interactive map...</p>
      </div>
    </div>
  )
});

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

interface NewDataSourceDialog {
  isOpen: boolean;
  latitude: number;
  longitude: number;
}

interface RealInteractiveMapProps {
  className?: string;
}

export function RealInteractiveMap({ className }: RealInteractiveMapProps) {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Load data sources from API
  const loadDataSources = useCallback(async () => {
    try {
      const response = await fetch('/api/data-sources');
      if (response.ok) {
        const result = await response.json();
        setDataSources(result.data || []);
      } else {
        console.error('Failed to load data sources:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading data sources:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and periodic updates
  useEffect(() => {
    loadDataSources();
    
    // Update every 30 seconds
    const interval = setInterval(loadDataSources, 30000);
    
    return () => clearInterval(interval);
  }, [loadDataSources]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setNewSourceDialog({
      isOpen: true,
      latitude: lat,
      longitude: lng
    });
  }, []);

  const handleAddDataSource = async () => {
    if (!newSource.name.trim()) return;

    try {
      const response = await fetch('/api/data-sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newSource.name,
          description: newSource.description,
          interfaceType: newSource.interfaceType,
          interfaceConfig: {
            latitude: newSourceDialog.latitude,
            longitude: newSourceDialog.longitude,
            host: 'localhost',
            port: newSource.interfaceType === 'TCP' ? 502 : 8080
          },
          protocolType: newSource.protocolType,
          protocolConfig: {},
          dataSourceType: newSource.dataSourceType,
          customConfig: {}
        }),
      });

      if (response.ok) {
        // Reload data sources
        await loadDataSources();
        
        // Reset form
        setNewSourceDialog({ isOpen: false, latitude: 0, longitude: 0 });
        setNewSource({
          name: '',
          description: '',
          interfaceType: 'TCP',
          protocolType: 'API_REST',
          dataSourceType: 'SENSOR'
        });
      } else {
        console.error('Failed to create data source');
      }
    } catch (error) {
      console.error('Error creating data source:', error);
    }
  };

  const handleDataSourceClick = useCallback((source: DataSource) => {
    console.log('Data source clicked:', source);
    // You can add more actions here, like opening a details dialog
  }, []);

  const handleDeleteDataSource = async (sourceId: number) => {
    if (!confirm('Are you sure you want to delete this data source?')) return;

    try {
      const response = await fetch(`/api/data-sources/${sourceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadDataSources();
      } else {
        console.error('Failed to delete data source');
      }
    } catch (error) {
      console.error('Error deleting data source:', error);
    }
  };

  const handleToggleActive = async (sourceId: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/data-sources/${sourceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        await loadDataSources();
      } else {
        console.error('Failed to toggle data source');
      }
    } catch (error) {
      console.error('Error toggling data source:', error);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center h-full bg-muted/50 rounded-lg", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading data sources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full", className)}>
      <MapContent
        dataSources={dataSources}
        onMapClick={handleMapClick}
        onDataSourceClick={handleDataSourceClick}
        onDeleteDataSource={handleDeleteDataSource}
        onToggleActive={handleToggleActive}
      />

      {/* Add Data Source Dialog */}
      <Dialog open={newSourceDialog.isOpen} onOpenChange={(open) => 
        setNewSourceDialog(prev => ({ ...prev, isOpen: open }))
      }>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Data Source</DialogTitle>
            <DialogDescription>
              Create a new data source at coordinates ({newSourceDialog.latitude.toFixed(4)}, {newSourceDialog.longitude.toFixed(4)})
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newSource.name}
                onChange={(e) => setNewSource(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter data source name"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newSource.description}
                onChange={(e) => setNewSource(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description (optional)"
                rows={2}
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
            <Button onClick={handleAddDataSource} disabled={!newSource.name.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Data Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
