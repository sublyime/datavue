'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, Plus, Wifi, WifiOff, Activity, Trash2, Settings, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'connecting';
  lastUpdated?: string;
}

interface NewDataSourceDialog {
  isOpen: boolean;
  latitude: number;
  longitude: number;
}

interface RealInteractiveMapProps {
  className?: string;
}

// Named export function
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

  // Mock data sources for demonstration (since API endpoints don't exist yet)
  useEffect(() => {
    const mockSources: DataSource[] = [
      {
        id: 1,
        name: 'Houston Plant Sensor',
        description: 'Temperature monitoring',
        interfaceType: 'TCP',
        protocolType: 'MODBUS_TCP',
        dataSourceType: 'SENSOR',
        isActive: true,
        latitude: 29.7604,
        longitude: -95.3698,
        connectionStatus: 'connected',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Singapore Terminal',
        description: 'Pressure monitoring',
        interfaceType: 'TCP',
        protocolType: 'API_REST',
        dataSourceType: 'POWER_METER',
        isActive: true,
        latitude: 1.3521,
        longitude: 103.8198,
        connectionStatus: 'connected',
        lastUpdated: new Date().toISOString()
      },
      {
        id: 3,
        name: 'Rotterdam Terminal',
        description: 'Flow monitoring',
        interfaceType: 'SERIAL',
        protocolType: 'MODBUS_RTU',
        dataSourceType: 'WEATHER_STATION',
        isActive: false,
        latitude: 51.9244,
        longitude: 4.4777,
        connectionStatus: 'disconnected'
      },
      {
        id: 4,
        name: 'London Office',
        description: 'Environmental monitoring',
        interfaceType: 'TCP',
        protocolType: 'MQTT',
        dataSourceType: 'SENSOR',
        isActive: true,
        latitude: 51.5074,
        longitude: -0.1278,
        connectionStatus: 'connected'
      },
      {
        id: 5,
        name: 'Tokyo Data Center',
        description: 'Server monitoring',
        interfaceType: 'TCP',
        protocolType: 'API_REST',
        dataSourceType: 'POWER_METER',
        isActive: true,
        latitude: 35.6762,
        longitude: 139.6503,
        connectionStatus: 'connected'
      }
    ];
    
    setTimeout(() => {
      setDataSources(mockSources);
      setLoading(false);
    }, 1000);
  }, []);

  // Convert coordinates to screen position for simplified map
  const coordinateToScreen = useCallback((lat: number, lng: number, width: number, height: number) => {
    // Simple projection - in a real app you'd use proper map projection
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
  }, []);

  const handleMapClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert screen coordinates back to lat/lng
    const lng = (x / rect.width) * 360 - 180;
    const lat = 90 - (y / rect.height) * 180;
    
    setNewSourceDialog({
      isOpen: true,
      latitude: lat,
      longitude: lng
    });
  }, []);

  const handleAddDataSource = () => {
    if (!newSource.name.trim()) return;

    const newId = Math.max(...dataSources.map(s => s.id), 0) + 1;
    const source: DataSource = {
      id: newId,
      name: newSource.name,
      description: newSource.description,
      interfaceType: newSource.interfaceType,
      protocolType: newSource.protocolType,
      dataSourceType: newSource.dataSourceType,
      isActive: true,
      latitude: newSourceDialog.latitude,
      longitude: newSourceDialog.longitude,
      connectionStatus: 'connected',
      lastUpdated: new Date().toISOString()
    };

    setDataSources(prev => [...prev, source]);
    setNewSourceDialog({ isOpen: false, latitude: 0, longitude: 0 });
    setNewSource({
      name: '',
      description: '',
      interfaceType: 'TCP',
      protocolType: 'API_REST',
      dataSourceType: 'SENSOR'
    });
  };

  const handleDeleteDataSource = (sourceId: number) => {
    if (!confirm('Are you sure you want to delete this data source?')) return;
    setDataSources(prev => prev.filter(s => s.id !== sourceId));
  };

  const handleToggleActive = (sourceId: number) => {
    setDataSources(prev => prev.map(s => 
      s.id === sourceId 
        ? { ...s, isActive: !s.isActive, connectionStatus: s.isActive ? 'disconnected' as const : 'connected' as const }
        : s
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Wifi className="h-3 w-3 text-green-500" />;
      case 'connecting': return <Activity className="h-3 w-3 text-yellow-500 animate-pulse" />;
      case 'error': return <WifiOff className="h-3 w-3 text-red-500" />;
      default: return <WifiOff className="h-3 w-3 text-gray-500" />;
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
      {/* Simple World Map Background */}
      <div 
        className="w-full h-full bg-gradient-to-b from-blue-100 to-green-100 rounded-lg cursor-crosshair relative overflow-hidden"
        onClick={handleMapClick}
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 60% 80%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)
          `
        }}
      >
        {/* Grid lines for reference */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Instructions */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-lg p-3 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-medium">Click anywhere to add a data source</span>
          </div>
        </div>

        {/* Data Source Markers */}
        {dataSources
          .filter(source => source.latitude !== undefined && source.longitude !== undefined)
          .map((source) => {
            const containerRect = { width: 800, height: 600 }; // Approximate container size
            const position = coordinateToScreen(
              source.latitude!,
              source.longitude!,
              containerRect.width,
              containerRect.height
            );

            return (
              <div
                key={source.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{
                  left: `${(position.x / containerRect.width) * 100}%`,
                  top: `${(position.y / containerRect.height) * 100}%`
                }}
              >
                {/* Marker */}
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-transform hover:scale-110",
                  source.isActive 
                    ? source.connectionStatus === 'connected' 
                      ? "bg-green-500" 
                      : "bg-yellow-500"
                    : "bg-gray-400"
                )}>
                  {getStatusIcon(source.connectionStatus)}
                </div>

                {/* Popup on hover */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <Card className="w-64 shadow-lg">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{source.name}</CardTitle>
                        <div className="flex items-center gap-1">
                          <Badge variant={source.isActive ? "default" : "secondary"}>
                            {source.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Badge 
                            variant={
                              source.connectionStatus === 'connected' ? "default" :
                              source.connectionStatus === 'error' ? "destructive" : "secondary"
                            }
                          >
                            {source.connectionStatus}
                          </Badge>
                        </div>
                      </div>
                      {source.description && (
                        <p className="text-xs text-muted-foreground">{source.description}</p>
                      )}
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
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
                          <span className="text-muted-foreground">Location:</span>
                          <p className="font-mono text-xs">
                            {source.latitude?.toFixed(4)}, {source.longitude?.toFixed(4)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pointer-events-auto">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant={source.isActive ? "destructive" : "default"}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleActive(source.id);
                            }}
                          >
                            <Power className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Edit source:', source.id);
                            }}
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDataSource(source.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            );
          })}
      </div>

      {/* Summary Stats */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur rounded-lg p-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>{dataSources.filter(s => s.connectionStatus === 'connected').length} Connected</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span>{dataSources.filter(s => !s.isActive).length} Inactive</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-primary" />
            <span>{dataSources.length} Total</span>
          </div>
        </div>
      </div>

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

// Default export as well for flexibility
export default RealInteractiveMap;