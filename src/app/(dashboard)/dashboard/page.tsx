'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Settings, TrendingUp, Database, Zap, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPlaceholder } from '@/components/map-placeholder';
import { DynamicChart } from '@/components/dynamic-chart';
import { useAuth } from '@/components/providers'; // ✅ FIXED: Updated import path
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

  // Mock data for demonstration
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
        }
      ];
      setDataSources(mockSources);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold">Loading dashboard...</h3>
          <p className="text-muted-foreground">Please wait while we prepare your data sources</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => router.push('/data-sources')} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Manage Sources
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Source
          </Button>
        </div>
      </div>

      {/* Auth Status Card */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-green-800">✅ System Status: Operational</CardTitle>
          <CardDescription>All systems are running normally</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><strong>User:</strong> {user?.name}</div>
            <div><strong>Role:</strong> {user?.role}</div>
            <div><strong>Sources:</strong> {dataSources.length}</div>
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
            <p className="text-xs text-muted-foreground">
              Configured data sources
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sources</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataSources.filter(s => s.isActive).length}</div>
            <p className="text-xs text-muted-foreground">
              {dataSources.length > 0 ? Math.round((dataSources.filter(s => s.isActive).length / dataSources.length) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataSources.filter(s => s.connectionStatus === 'connected').length}</div>
            <p className="text-xs text-muted-foreground">
              Real-time streaming
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45,231</div>
            <p className="text-xs text-muted-foreground">
              Total collected today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Global Data Sources</CardTitle>
                <CardDescription>
                  Geographic distribution of your monitoring infrastructure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <MapPlaceholder />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Real-time Data Stream</CardTitle>
                <CardDescription>
                  Live data from connected sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <DynamicChart
                    title="System Performance"
                    description="Real-time metrics"
                    yAxisLabel="Values"
                    initialData={[
                      { time: "1", value: 45 },
                      { time: "2", value: 52 },
                      { time: "3", value: 48 },
                      { time: "4", value: 61 },
                      { time: "5", value: 55 }
                    ]}
                    color="hsl(var(--chart-1))"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Map</CardTitle>
              <CardDescription>
                Click on markers to view detailed information about each data source
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
                <MapPlaceholder />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Historical data analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <DynamicChart
                    title="Performance"
                    description="24-hour trend"
                    yAxisLabel="Performance %"
                    initialData={[
                      { time: "00:00", value: 85 },
                      { time: "06:00", value: 92 },
                      { time: "12:00", value: 78 },
                      { time: "18:00", value: 95 },
                      { time: "24:00", value: 88 }
                    ]}
                    color="hsl(var(--chart-2))"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Quality</CardTitle>
                <CardDescription>Signal reliability metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <DynamicChart
                    title="Quality Score"
                    description="Data integrity over time"
                    yAxisLabel="Quality %"
                    initialData={[
                      { time: "1h", value: 98 },
                      { time: "2h", value: 96 },
                      { time: "3h", value: 99 },
                      { time: "4h", value: 97 },
                      { time: "5h", value: 95 }
                    ]}
                    color="hsl(var(--chart-3))"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Sources</CardTitle>
              <CardDescription>
                Manage and monitor all your configured data sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {dataSources.map((source) => (
                    <Card key={source.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {source.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {source.interfaceType}/{source.protocolType} • {source.dataSourceType}
                          </p>
                          {source.description && (
                            <p className="text-xs text-muted-foreground">{source.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
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
                          {source.lastValue !== undefined && (
                            <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                              {source.lastValue.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {dataSources.length === 0 && (
                    <div className="text-center py-12">
                      <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Data Sources</h3>
                      <p className="text-muted-foreground mb-4">
                        Get started by adding your first data source.
                      </p>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Data Source
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
