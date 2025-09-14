// src/app/(dashboard)/data-sources/page.tsx
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
import { apiClient } from '@/lib/api-client';
import { DataSourceConfig } from '@/lib/data-sources/types';
import { useToast } from '@/hooks/use-toast';

const typeIcons = {
  SERIAL: <Cable className="h-4 w-4 text-muted-foreground" />,
  USB: <Cable className="h-4 w-4 text-muted-foreground" />,
  FILE: <File className="h-4 w-4 text-muted-foreground" />,
  TCP: <Server className="h-4 w-4 text-muted-foreground" />,
  UDP: <Server className="h-4 w-4 text-muted-foreground" />,
  API: <Rss className="h-4 w-4 text-muted-foreground" />,
  MODBUS: <Server className="h-4 w-4 text-muted-foreground" />,
  MQTT: <Rss className="h-4 w-4 text-muted-foreground" />,
};

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' | 'outline' } = {
  Active: 'default',
  Inactive: 'destructive',
  Standby: 'secondary',
  Running: 'default',
  Stopped: 'outline',
  Error: 'destructive',
};

interface DataSourceFormData {
  name: string;
  type: string;
  protocol: string;
  config: Record<string, any>;
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
      setDataSources(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load data sources',
        variant: 'destructive',
      });
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Data Sources</h1>
        <p className="text-muted-foreground">
          Configure and manage your data ingestion points.
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Data Sources</CardTitle>
            <CardDescription>
              Configure and manage your data ingestion points.
            </CardDescription>
          </div>
          <Sheet open={createSheetOpen} onOpenChange={setCreateSheetOpen}>
            <SheetTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Source
              </Button>
            </SheetTrigger>
            <SheetContent>
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

          {/* Edit Sheet */}
          <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
            <SheetContent>
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Protocol</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataSources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No data sources configured. Add your first data source to get started.
                  </TableCell>
                </TableRow>
              ) : (
                dataSources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium">{source.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {typeIcons[source.type as keyof typeof typeIcons]}
                        {source.type}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{source.protocol}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[source.runtimeStatus?.isRunning ? 'Running' : 'Stopped']}>
                        {source.runtimeStatus?.isRunning ? 'Running' : 'Stopped'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleSource(source.id, source.runtimeStatus?.isRunning || false)}
                        >
                          {source.runtimeStatus?.isRunning ? (
                            <StopCircle className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleEditClick(source)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteSource(source.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
    type: initialData?.type || '',
    protocol: initialData?.protocol || '',
    config: initialData?.config || {},
    isActive: initialData?.isActive !== false,
  });

  // Configuration fields based on protocol type
  const getConfigFields = () => {
    const config = formData.config || {};
    
    switch (formData.protocol) {
      case 'MODBUS':
        return (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="host" className="text-right">Host</Label>
              <Input
                id="host"
                value={config.host || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...config, host: e.target.value }
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
                value={config.port || '502'}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...config, port: parseInt(e.target.value) }
                })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unitId" className="text-right">Unit ID</Label>
              <Input
                id="unitId"
                type="number"
                value={config.unitId || '1'}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...config, unitId: parseInt(e.target.value) }
                })}
                className="col-span-3"
              />
            </div>
          </>
        );
      
      case 'MQTT':
        return (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="brokerUrl" className="text-right">Broker URL</Label>
              <Input
                id="brokerUrl"
                value={config.brokerUrl || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...config, brokerUrl: e.target.value }
                })}
                placeholder="mqtt://localhost:1883"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="topics" className="text-right">Topics</Label>
              <Textarea
                id="topics"
                value={Array.isArray(config.topics) ? config.topics.join('\n') : config.topics || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...config, topics: e.target.value.split('\n').filter(t => t.trim()) }
                })}
                placeholder="topic1&#10;topic2&#10;sensors/+"
                className="col-span-3"
              />
            </div>
          </>
        );
        
      case 'NMEA':
        return (
          <>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="port" className="text-right">Serial Port</Label>
              <Input
                id="port"
                value={config.port || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...config, port: e.target.value }
                })}
                placeholder="COM1 or /dev/ttyUSB0"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="baudRate" className="text-right">Baud Rate</Label>
              <Select
                value={config.baudRate?.toString() || '4800'}
                onValueChange={(value) => setFormData({
                  ...formData,
                  config: { ...config, baudRate: parseInt(value) }
                })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4800">4800</SelectItem>
                  <SelectItem value="9600">9600</SelectItem>
                  <SelectItem value="38400">38400</SelectItem>
                  <SelectItem value="115200">115200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
        
      default:
        return (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="configJson" className="text-right">Configuration</Label>
            <Textarea
              id="configJson"
              value={JSON.stringify(config, null, 2)}
              onChange={(e) => {
                try {
                  const parsedConfig = JSON.parse(e.target.value);
                  setFormData({ ...formData, config: parsedConfig });
                } catch {
                  // Invalid JSON, don't update
                }
              }}
              placeholder='{"key": "value"}'
              className="col-span-3 font-mono"
            />
          </div>
        );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.protocol) {
      return; // Basic validation
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">Name</Label>
        <Input
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Factory Floor PLC"
          className="col-span-3"
        />
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="type" className="text-right">Type</Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
          required
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select a source type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SERIAL">Serial</SelectItem>
            <SelectItem value="TCP">TCP</SelectItem>
            <SelectItem value="UDP">UDP</SelectItem>
            <SelectItem value="API">API</SelectItem>
            <SelectItem value="MODBUS">Modbus</SelectItem>
            <SelectItem value="MQTT">MQTT</SelectItem>
            <SelectItem value="FILE">File</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="protocol" className="text-right">Protocol</Label>
        <Select
          value={formData.protocol}
          onValueChange={(value) => setFormData({ ...formData, protocol: value })}
          required
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select a protocol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MODBUS">MODBUS</SelectItem>
            <SelectItem value="MQTT">MQTT</SelectItem>
            <SelectItem value="NMEA">NMEA</SelectItem>
            <SelectItem value="HART">HART</SelectItem>
            <SelectItem value="OPC">OPC</SelectItem>
            <SelectItem value="OSI_PI">OSI PI</SelectItem>
            <SelectItem value="ANALOG_4_20mA">4-20mA</SelectItem>
            <SelectItem value="ANALOG_0_5V">0-5v</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dynamic configuration fields */}
      {formData.protocol && getConfigFields()}

      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="isActive" className="text-right">Active</Label>
        <div className="col-span-3">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4"
          />
          <Label htmlFor="isActive" className="ml-2 text-sm">
            Start immediately after creation
          </Label>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {isEditing ? 'Update Data Source' : 'Create Data Source'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}