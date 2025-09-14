'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Settings, TrendingUp, Database, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/providers'; // ✅ Correct import
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

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

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  
  // Mock data for demo
  useEffect(() => {
    if (user) {
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
          lastValue: 72.5,
          lastUpdated: new Date().toISOString(),
          connectionStatus: 'connected'
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
          lastValue: 1.2,
          lastUpdated: new Date().toISOString(),
          connectionStatus: 'connected'
        }
      ];
      setDataSources(mockSources);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button onClick={() => router.push('/data-sources')} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Manage Sources
          </Button>
        </div>
      </div>

      {/* Auth Success Card */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">✅ Dashboard Ready!</CardTitle>
          <CardDescription>Welcome back, {user?.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Email:</strong> {user?.email}</div>
            <div><strong>Role:</strong> {user?.role}</div>
            <div><strong>Data Sources:</strong> {dataSources.length}</div>
            <div><strong>Active:</strong> {dataSources.filter(s => s.isActive).length}</div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataSources.length}</div>
            <p className="text-xs text-muted-foreground">Ready for monitoring</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sources</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataSources.filter(s => s.isActive).length}</div>
            <p className="text-xs text-muted-foreground">Currently streaming data</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataSources.filter(s => s.connectionStatus === 'connected').length}</div>
            <p className="text-xs text-muted-foreground">Real-time status</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,486</div>
            <p className="text-xs text-muted-foreground">Total collected</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => router.push('/data-sources')}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-5 w-5" />
              Manage Data Sources
            </CardTitle>
            <CardDescription>Configure and monitor your data sources</CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="cursor-pointer hover:bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              View Analytics
            </CardTitle>
            <CardDescription>Analyze historical data trends</CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => router.push('/settings')}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Settings
            </CardTitle>
            <CardDescription>Configure system preferences</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
