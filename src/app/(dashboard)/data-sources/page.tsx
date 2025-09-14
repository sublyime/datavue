'use client';

import { useState, useEffect } from 'react';
import {
  Cable,
  File,
  PlusCircle,
  Rss,
  Server,
  MoreVertical,
  Play,
  StopCircle,
  Edit,
  Trash2,
  Wifi,
  Network,
  Database,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { apiClient } from '@/lib/api-client';
import { DataSourceConfig } from '@/lib/data-sources/types';
import { useToast } from '@/hooks/use-toast';

// Updated icon mapping for interface types
const interfaceIcons = {
  SERIAL: <Cable className="h-4 w-4" />,
  TCP: <Network className="h-4 w-4" />,
  UDP: <Wifi className="h-4 w-4" />,
  USB: <Cable className="h-4 w-4" />,
  FILE: <File className="h-4 w-4" />,
};

// Protocol icons
const protocolIcons = {
  MODBUS_RTU: <Server className="h-4 w-4" />,
  MODBUS_TCP: <Server className="h-4 w-4" />,
  MQTT: <Rss className="h-4 w-4" />,
  NMEA_0183: <Wifi className="h-4 w-4" />,
  OPC_UA: <Database className="h-4 w-4" />,
  API_REST: <Network className="h-4 w-4" />,
  API_SOAP: <Network className="h-4 w-4" />,
  HART: <Cable className="h-4 w-4" />,
  ANALOG_4_20MA: <Cable className="h-4 w-4" />,
  ANALOG_0_5V: <Cable className="h-4 w-4" />,
  OSI_PI: <Database className="h-4 w-4" />,
};

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Running: 'default',
  Stopped: 'outline',
  Error: 'destructive',
  Connecting: 'secondary',
};

// Form data interface (what the form submits)
interface DataSourceFormData {
  name: string;
  description?: string;
  interface: {
    type: string;
    config: Record<string, any>;
  };
  protocol: {
    type: string;
    config: Record<string, any>;
  };
  dataSource: {
    type: string;
    templateId?: string;
    customConfig?: Record<string, any>;
  };
  isActive?: boolean;
}

export default function DataSourcesPage() {
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<DataSourceConfig | null>(null);
  const [dataSources, setDataSources] = useState<DataSourceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDataSources();
  }, []);

  const loadDataSources = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getDataSources();
      setDataSources(response.data || []);
    } catch (error) {
      console.error('Failed to load data sources:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data sources',
        variant: 'destructive',
      });
      setDataSources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSource = async (data: DataSourceFormData) => {
    try {
      await apiClient.createDataSource(data);
      toast({
        title: 'Success',
        description: 'Data source created successfully',
      });
      setCreateSheetOpen(false);
      loadDataSources();
    } catch (error) {
      console.error('Failed to create data source:', error);
      toast({
        title: 'Error',
        description: 'Failed to create data source',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateSource = async (data: DataSourceFormData) => {
    if (!editingSource) return;

    try {
      await apiClient.updateDataSource(editingSource.id, data);
      toast({
        title: 'Success',
        description: 'Data source updated successfully',
      });
      setEditSheetOpen(false);
      setEditingSource(null);
      loadDataSources();
    } catch (error) {
      console.error('Failed to update data source:', error);
      toast({
        title: 'Error',
        description: 'Failed to update data source',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSource = async (id: number) => {
    if (!confirm('Are you sure you want to delete this data source?')) return;

    try {
      await apiClient.deleteDataSource(id);
      toast({
        title: 'Success',
        description: 'Data source deleted successfully',
      });
      loadDataSources();
    } catch (error) {
      console.error('Failed to delete data source:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete data source',
        variant: 'destructive',
      });
    }
  };

  const handleToggleSource = async (id: number, isRunning: boolean) => {
    try {
      if (isRunning) {
        await apiClient.stopDataSource(id);
        toast({
          title: 'Success',
          description: 'Data source stopped',
        });
      } else {
        await apiClient.startDataSource(id);
        toast({
          title: 'Success',
          description: 'Data source started',
        });
      }
      loadDataSources();
    } catch (error) {
      console.error(`Failed to ${isRunning ? 'stop' : 'start'} data source:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${isRunning ? 'stop' : 'start'} data source`,
        variant: 'destructive',
      });
    }
  };

  const handleEditClick = (source: DataSourceConfig) => {
    setEditingSource(source);
    setEditSheetOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading data sources...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Data Sources</h2>
          <p className="text-muted-foreground">
            Configure and manage your data ingestion points.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
            <SheetTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Source
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[600px] sm:max-w-[600px]">
              <SheetHeader>
                <SheetTitle>Add a New Data Source</SheetTitle>
                <SheetDescription>
                  Configure a new ingestion point for your data.
                </SheetDescription>
              </SheetHeader>
              <DataSourceForm
                onSubmit={handleCreateSource}
                onCancel={() => setCreateSheetOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Edit Sheet */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px]">
          <SheetHeader>
            <SheetTitle>Edit Data Source</SheetTitle>
            <SheetDescription>
              Update the configuration for this data source.
            </SheetDescription>
          </SheetHeader>
          {editingSource && (
            <DataSourceForm
              initialData={editingSource}
              onSubmit={handleUpdateSource}
              onCancel={() => {
                setEditSheetOpen(false);
                setEditingSource(null);
              }}
              isEditing
            />
          )}
        </SheetContent>
      </Sheet>

      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>
            Manage your configured data sources and their status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Interface</TableHead>
                <TableHead>Protocol</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataSources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No data sources configured. Add your first data source to get started.
                  </TableCell>
                </TableRow>
              ) : (
                dataSources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{source.name}</div>
                        {source.description && (
                          <div className="text-sm text-muted-foreground">
                            {source.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {interfaceIcons[source.interface?.type as keyof typeof interfaceIcons] || <Cable className="h-4 w-4" />}
                        <span>{source.interface?.type || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {protocolIcons[source.protocol?.type as keyof typeof protocolIcons] || <Server className="h-4 w-4" />}
                        <span>{source.protocol?.type || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span>{source.dataSource?.type || 'N/A'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={statusColors[source.runtimeStatus?.isRunning ? 'Running' : 'Stopped'] || 'outline'}
                      >
                        {source.runtimeStatus?.isRunning ? 'Running' : 'Stopped'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleToggleSource(source.id, source.runtimeStatus?.isRunning || false)}
                          >
                            {source.runtimeStatus?.isRunning ? (
                              <>
                                <StopCircle className="mr-2 h-4 w-4" />
                                Stop
                              </>
                            ) : (
                              <>
                                <Play className="mr-2 h-4 w-4" />
                                Start
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditClick(source)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteSource(source.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Enhanced Data Source Form Component
interface DataSourceFormProps {
  initialData?: DataSourceConfig;
  onSubmit: (data: DataSourceFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

function DataSourceForm({ initialData, onSubmit, onCancel, isEditing = false }: DataSourceFormProps) {
  const [formData, setFormData] = useState<DataSourceFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    interface: {
      type: initialData?.interface?.type || '',
      config: initialData?.interface?.config || {},
    },
    protocol: {
      type: initialData?.protocol?.type || '',
      config: initialData?.protocol?.config || {},
    },
    dataSource: {
      type: initialData?.dataSource?.type || '',
      templateId: initialData?.dataSource?.templateId,
      customConfig: initialData?.dataSource?.customConfig || {},
    },
    isActive: initialData?.isActive !== false,
  });

  // Configuration fields based on interface type
  const getInterfaceConfigFields = () => {
    const config = formData.interface.config;
    
    switch (formData.interface.type) {
      case 'TCP':
        return (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="host" className="text-right">Host</Label>
              <Input
                id="host"
                value={config.host || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  interface: {
                    ...formData.interface,
                    config: { ...config, host: e.target.value }
                  }
                })}
                placeholder="192.168.1.100"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="port" className="text-right">Port</Label>
              <Input
                id="port"
                type="number"
                value={config.port || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  interface: {
                    ...formData.interface,
                    config: { ...config, port: parseInt(e.target.value) || 0 }
                  }
                })}
                placeholder="502"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="timeout" className="text-right">Timeout (ms)</Label>
              <Input
                id="timeout"
                type="number"
                value={config.timeout || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  interface: {
                    ...formData.interface,
                    config: { ...config, timeout: parseInt(e.target.value) || 5000 }
                  }
                })}
                placeholder="5000"
                className="col-span-3"
              />
            </div>
          </>
        );
      case 'SERIAL':
        return (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="serialPort" className="text-right">Serial Port</Label>
              <Input
                id="serialPort"
                value={config.port || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  interface: {
                    ...formData.interface,
                    config: { ...config, port: e.target.value }
                  }
                })}
                placeholder="COM1 or /dev/ttyUSB0"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="baudRate" className="text-right">Baud Rate</Label>
              <Select
                value={config.baudRate?.toString() || ''}
                onValueChange={(value) => setFormData({
                  ...formData,
                  interface: {
                    ...formData.interface,
                    config: { ...config, baudRate: parseInt(value) }
                  }
                })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select baud rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1200">1200</SelectItem>
                  <SelectItem value="4800">4800</SelectItem>
                  <SelectItem value="9600">9600</SelectItem>
                  <SelectItem value="19200">19200</SelectItem>
                  <SelectItem value="38400">38400</SelectItem>
                  <SelectItem value="57600">57600</SelectItem>
                  <SelectItem value="115200">115200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case 'FILE':
        return (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="filePath" className="text-right">File Path</Label>
            <Input
              id="filePath"
              value={config.path || ''}
              onChange={(e) => setFormData({
                ...formData,
                interface: {
                  ...formData.interface,
                  config: { ...config, path: e.target.value }
                }
              })}
              placeholder="/path/to/file.csv"
              className="col-span-3"
            />
          </div>
        );
      case 'UDP':
        return (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="udpPort" className="text-right">Port</Label>
            <Input
              id="udpPort"
              type="number"
              value={config.port || ''}
              onChange={(e) => setFormData({
                ...formData,
                interface: {
                  ...formData.interface,
                  config: { ...config, port: parseInt(e.target.value) || 0 }
                }
              })}
              placeholder="1234"
              className="col-span-3"
            />
          </div>
        );
      case 'USB':
        return (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="vendorId" className="text-right">Vendor ID</Label>
              <Input
                id="vendorId"
                value={config.vendorId || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  interface: {
                    ...formData.interface,
                    config: { ...config, vendorId: e.target.value }
                  }
                })}
                placeholder="0x1234"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="productId" className="text-right">Product ID</Label>
              <Input
                id="productId"
                value={config.productId || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  interface: {
                    ...formData.interface,
                    config: { ...config, productId: e.target.value }
                  }
                })}
                placeholder="0x5678"
                className="col-span-3"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  // Configuration fields based on protocol type
  const getProtocolConfigFields = () => {
    const config = formData.protocol.config;
    
    switch (formData.protocol.type) {
      case 'MODBUS_TCP':
      case 'MODBUS_RTU':
        return (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unitId" className="text-right">Unit ID</Label>
            <Input
              id="unitId"
              type="number"
              value={config.unitId || ''}
              onChange={(e) => setFormData({
                ...formData,
                protocol: {
                  ...formData.protocol,
                  config: { ...config, unitId: parseInt(e.target.value) || 1 }
                }
              })}
              placeholder="1"
              className="col-span-3"
            />
          </div>
        );
      case 'MQTT':
        return (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="topics" className="text-right">Topics</Label>
            <Textarea
              id="topics"
              value={config.topics?.map((t: any) => typeof t === 'string' ? t : t.topic).join('\n') || ''}
              onChange={(e) => setFormData({
                ...formData,
                protocol: {
                  ...formData.protocol,
                  config: { 
                    ...config, 
                    topics: e.target.value.split('\n').filter(t => t.trim()).map(topic => ({
                      topic: topic.trim(),
                      qos: 1,
                      tagMapping: topic.trim()
                    }))
                  }
                }
              })}
              placeholder="topic1&#10;sensors/+/temperature&#10;sensors/+/humidity"
              className="col-span-3"
            />
          </div>
        );
      case 'OPC_UA':
        return (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endpointUrl" className="text-right">Endpoint URL</Label>
              <Input
                id="endpointUrl"
                value={config.endpointUrl || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  protocol: {
                    ...formData.protocol,
                    config: { ...config, endpointUrl: e.target.value }
                  }
                })}
                placeholder="opc.tcp://localhost:4840"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="securityMode" className="text-right">Security Mode</Label>
              <Select
                value={config.securityMode || 'None'}
                onValueChange={(value) => setFormData({
                  ...formData,
                  protocol: {
                    ...formData.protocol,
                    config: { ...config, securityMode: value }
                  }
                })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Sign">Sign</SelectItem>
                  <SelectItem value="SignAndEncrypt">Sign and Encrypt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case 'API_REST':
      case 'API_SOAP':
        return (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="method" className="text-right">Method</Label>
              <Select
                value={config.method || 'GET'}
                onValueChange={(value) => setFormData({
                  ...formData,
                  protocol: {
                    ...formData.protocol,
                    config: { ...config, method: value }
                  }
                })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pollInterval" className="text-right">Poll Interval (ms)</Label>
              <Input
                id="pollInterval"
                type="number"
                value={config.pollInterval || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  protocol: {
                    ...formData.protocol,
                    config: { ...config, pollInterval: parseInt(e.target.value) || 10000 }
                  }
                })}
                placeholder="10000"
                className="col-span-3"
              />
            </div>
          </>
        );
      case 'NMEA_0183':
        return (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sentences" className="text-right">NMEA Sentences</Label>
            <Input
              id="sentences"
              value={config.sentences?.join(', ') || ''}
              onChange={(e) => setFormData({
                ...formData,
                protocol: {
                  ...formData.protocol,
                  config: { ...config, sentences: e.target.value.split(',').map(s => s.trim()).filter(s => s) }
                }
              })}
              placeholder="GPGGA, GPRMC, GPVTG"
              className="col-span-3"
            />
          </div>
        );
      case 'HART':
        return (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="deviceAddress" className="text-right">Device Address</Label>
            <Input
              id="deviceAddress"
              type="number"
              value={config.deviceAddress || ''}
              onChange={(e) => setFormData({
                ...formData,
                protocol: {
                  ...formData.protocol,
                  config: { ...config, deviceAddress: parseInt(e.target.value) || 0 }
                }
              })}
              placeholder="0"
              className="col-span-3"
            />
          </div>
        );
      case 'ANALOG_4_20MA':
      case 'ANALOG_0_5V':
        return (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="samplingRate" className="text-right">Sampling Rate (ms)</Label>
              <Input
                id="samplingRate"
                type="number"
                value={config.samplingRate || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  protocol: {
                    ...formData.protocol,
                    config: { ...config, samplingRate: parseInt(e.target.value) || 1000 }
                  }
                })}
                placeholder="1000"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scalingMin" className="text-right">Scaling Min</Label>
              <Input
                id="scalingMin"
                type="number"
                step="0.1"
                value={config.scalingMin || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  protocol: {
                    ...formData.protocol,
                    config: { ...config, scalingMin: parseFloat(e.target.value) || 0 }
                  }
                })}
                placeholder="0"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="scalingMax" className="text-right">Scaling Max</Label>
              <Input
                id="scalingMax"
                type="number"
                step="0.1"
                value={config.scalingMax || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  protocol: {
                    ...formData.protocol,
                    config: { ...config, scalingMax: parseFloat(e.target.value) || 100 }
                  }
                })}
                placeholder="100"
                className="col-span-3"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.interface.type || !formData.protocol.type || !formData.dataSource.type) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Factory Floor PLC"
          className="col-span-3"
          required
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optional description"
          className="col-span-3"
        />
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="interfaceType" className="text-right">Interface *</Label>
        <Select
          value={formData.interface.type}
          onValueChange={(value) => setFormData({
            ...formData,
            interface: { type: value, config: {} }
          })}
          required
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select interface type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SERIAL">Serial</SelectItem>
            <SelectItem value="TCP">TCP</SelectItem>
            <SelectItem value="UDP">UDP</SelectItem>
            <SelectItem value="USB">USB</SelectItem>
            <SelectItem value="FILE">File</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dynamic interface configuration fields */}
      {formData.interface.type && getInterfaceConfigFields()}

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="protocolType" className="text-right">Protocol *</Label>
        <Select
          value={formData.protocol.type}
          onValueChange={(value) => setFormData({
            ...formData,
            protocol: { type: value, config: {} }
          })}
          required
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select protocol type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MODBUS_RTU">Modbus RTU</SelectItem>
            <SelectItem value="MODBUS_TCP">Modbus TCP</SelectItem>
            <SelectItem value="MQTT">MQTT</SelectItem>
            <SelectItem value="NMEA_0183">NMEA 0183</SelectItem>
            <SelectItem value="OPC_UA">OPC UA</SelectItem>
            <SelectItem value="OSI_PI">OSI PI</SelectItem>
            <SelectItem value="API_REST">REST API</SelectItem>
            <SelectItem value="API_SOAP">SOAP API</SelectItem>
            <SelectItem value="HART">HART</SelectItem>
            <SelectItem value="ANALOG_4_20MA">4-20mA</SelectItem>
            <SelectItem value="ANALOG_0_5V">0-5V</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dynamic protocol configuration fields */}
      {formData.protocol.type && getProtocolConfigFields()}

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="dataSourceType" className="text-right">Data Source Type *</Label>
        <Select
          value={formData.dataSource.type}
          onValueChange={(value) => setFormData({
            ...formData,
            dataSource: { ...formData.dataSource, type: value }
          })}
          required
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select data source type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PLC">PLC</SelectItem>
            <SelectItem value="HMI">HMI</SelectItem>
            <SelectItem value="SENSOR_NETWORK">Sensor Network</SelectItem>
            <SelectItem value="WEATHER_STATION">Weather Station</SelectItem>
            <SelectItem value="GPS_TRACKER">GPS Tracker</SelectItem>
            <SelectItem value="FLOW_METER">Flow Meter</SelectItem>
            <SelectItem value="TEMPERATURE_SENSOR">Temperature Sensor</SelectItem>
            <SelectItem value="PRESSURE_TRANSMITTER">Pressure Transmitter</SelectItem>
            <SelectItem value="LEVEL_SENSOR">Level Sensor</SelectItem>
            <SelectItem value="VIBRATION_MONITOR">Vibration Monitor</SelectItem>
            <SelectItem value="GAS_DETECTOR">Gas Detector</SelectItem>
            <SelectItem value="WATER_QUALITY_SENSOR">Water Quality Sensor</SelectItem>
            <SelectItem value="POWER_METER">Power Meter</SelectItem>
            <SelectItem value="HISTORIAN_SERVER">Historian Server</SelectItem>
            <SelectItem value="SCADA_SYSTEM">SCADA System</SelectItem>
            <SelectItem value="CUSTOM">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Active</Label>
        <div className="col-span-3 flex items-center space-x-2">
          <Checkbox
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
          />
          <Label htmlFor="isActive" className="text-sm">
            Start immediately after creation
          </Label>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditing ? 'Update Data Source' : 'Create Data Source'}
        </Button>
      </div>
    </form>
  );
}
