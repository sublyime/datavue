// app/(dashboard)/data-sources/page.tsx
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

export default function DataSourcesPage() {
  const [openSheet, setOpenSheet] = useState(false);
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

  const handleCreateSource = async (data: Partial<DataSourceConfig>) => {
    try {
      await apiClient.createDataSource(data);
      toast({
        title: 'Success',
        description: 'Data source created successfully',
      });
      setOpenSheet(false);
      loadDataSources();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create data source',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSource = async (id: number) => {
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>
            Configure and manage your data ingestion points.
          </CardDescription>
        </div>
        <Sheet open={openSheet} onOpenChange={setOpenSheet}>
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
            <DataSourceForm onSubmit={handleCreateSource} />
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
            {dataSources.map((source) => (
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
                      onClick={() => handleToggleSource(source.id, source.runtimeStatus?.isRunning)}
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
                        <DropdownMenuItem>
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
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Data Source Form Component
function DataSourceForm({ onSubmit }: { onSubmit: (data: Partial<DataSourceConfig>) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    protocol: '',
    config: {},
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Name
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Factory Floor PLC"
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="type" className="text-right">
          Type
        </Label>
        <Select
          value={formData.type}
          onValueChange={(value) => setFormData({ ...formData, type: value })}
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
        <Label htmlFor="protocol" className="text-right">
          Protocol
        </Label>
        <Select
          value={formData.protocol}
          onValueChange={(value) => setFormData({ ...formData, protocol: value })}
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
      <Button type="submit" className="w-full">
        Create Data Source
      </Button>
    </form>
  );
}