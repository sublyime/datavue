'use client';

import { useState } from 'react';
import {
  Cable,
  File,
  PlusCircle,
  Rss,
  Server,
  MoreVertical,
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

const sources = [
  {
    id: 'src-001',
    name: 'Mainframe Telemetry',
    type: 'TCP',
    protocol: 'MODBUS',
    status: 'Active',
  },
  {
    id: 'src-002',
    name: 'Drilling Sensor Array',
    type: 'Serial',
    protocol: 'NMEA',
    status: 'Active',
  },
  {
    id: 'src-003',
    name: 'West-wing HVAC',
    type: 'API',
    protocol: 'MQTT',
    status: 'Inactive',
  },
  {
    id: 'src-004',
    name: 'Backup Generator Log',
    type: 'File',
    protocol: 'CSV',
    status: 'Standby',
  },
];

const typeIcons = {
  TCP: <Server className="h-4 w-4 text-muted-foreground" />,
  Serial: <Cable className="h-4 w-4 text-muted-foreground" />,
  API: <Rss className="h-4 w-4 text-muted-foreground" />,
  File: <File className="h-4 w-4 text-muted-foreground" />,
};

const statusColors: { [key: string]: 'default' | 'secondary' | 'destructive' } =
  {
    Active: 'default',
    Inactive: 'destructive',
    Standby: 'secondary',
  };

export default function DataSourcesPage() {
  const [openSheet, setOpenSheet] = useState(false);

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
              <PlusCircle />
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
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input id="name" placeholder="e.g., Factory Floor PLC" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a source type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="serial">Serial (USB)</SelectItem>
                    <SelectItem value="file">File (CSV, XLS)</SelectItem>
                    <SelectItem value="tcp">TCP/UDP</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="protocol" className="text-right">
                  Protocol
                </Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a protocol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modbus">MODBUS</SelectItem>
                    <SelectItem value="mqtt">MQTT</SelectItem>
                    <SelectItem value="nmea">NMEA</SelectItem>
                    <SelectItem value="hart">HART</SelectItem>
                    <SelectItem value="opc">OPC</SelectItem>
                    <SelectItem value="osipi">OSI PI</SelectItem>
                    <SelectItem value="analog420">4-20mA</SelectItem>
                    <SelectItem value="analog05">0-5v</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => setOpenSheet(false)} className="w-full">Save Configuration</Button>
            </div>
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
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => (
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
                  <Badge variant={statusColors[source.status]}>
                    {source.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Disable</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
