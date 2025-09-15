// src/app/(dashboard)/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Settings, TrendingUp, Database, Zap, RefreshCw, MapPin, Activity, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RealInteractiveMap } from '@/components/real-interactive-map';
import { RealTimeChart } from '@/components/real-time-chart';
import { useAuth } from '@/components/providers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { DataSource } from '@/types/data-source'; // Import the shared type

interface DashboardStats {
  totalSources: number;
  activeSources: number;
  connectedSources: number;
  totalDataPoints: number;
  alertingSources: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);

  useEffect(() => {
    // Check for user or auth token directly in localStorage as a fallback
    // This addresses the issue of the auth provider potentially failing
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;

    if (!user && !authToken) {
      // Redirect to login if no authenticated user or token is found
      router.push('/login');
    } else {
      fetchDashboardData();
    }
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsResult, sourcesResult] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getDataSources(),
      ]);
      setStats(statsResult.summary);
      setDataSources(sourcesResult.dataSources);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const handleMarkerClick = (dataSource: DataSource) => {
    setSelectedSource(dataSource);
  };

  return (
    <div className="flex flex-col h-full p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || 'User'}! Here's a summary of your data sources.
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
        <TabsList className="grid w-full grid-cols-2 lg:w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="flex-1 mt-6 overflow-hidden flex flex-col">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalSources ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  Total data sources registered
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sources</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.activeSources ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently online and active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Connected Sources</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.connectedSources ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Actively sending data
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alerts Triggered</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.alertingSources ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sources with active alerts
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 flex-1 overflow-hidden">
            <div className="lg:col-span-2 flex flex-col">
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    Data Source Map
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" /> Add Source
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Geographical overview of all data sources.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 relative">
                  <RealInteractiveMap
                    dataSources={dataSources}
                    onMarkerClick={handleMarkerClick}
                  />
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-1 flex flex-col">
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle>Recent Alerts</CardTitle>
                  <CardDescription>
                    Latest alerts from your data sources.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  <ScrollArea className="h-full pr-4">
                    <ul className="space-y-4">
                      {dataSources.filter(s => s.threshold && s.lastValue && (s.lastValue < s.threshold.min || s.lastValue > s.threshold.max)).map(source => (
                        <li key={source.id} className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-500 mt-1" />
                          <div>
                            <p className="font-medium">{source.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Value **{source.lastValue} {source.unit}** is outside threshold.
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="charts" className="flex-1 mt-6 flex flex-col overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
            <div className="lg:col-span-1 flex flex-col">
              {selectedSource ? (
                <Card className="flex-1 flex flex-col">
                  <CardHeader>
                    <CardTitle>{selectedSource.name} - Real-time Data</CardTitle>
                    <CardDescription>{selectedSource.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pb-4">
                    <RealTimeChart
                      dataSourceId={selectedSource.id}
                      title={selectedSource.name}
                      yAxisLabel={selectedSource.unit || 'Value'}
                      color="hsl(var(--chart-2))"
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground">
                  <p>Click on a data source marker on the map to view its real-time chart.</p>
                </Card>
              )}
            </div>
            <div className="lg:col-span-1 flex flex-col">
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle>Data Source List</CardTitle>
                  <CardDescription>
                    Browse and manage all your data sources.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  <ScrollArea className="h-full pr-4">
                    <ul className="space-y-4">
                      {dataSources.map(source => (
                        <li key={source.id} className="border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleMarkerClick(source)}>
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold">{source.name}</h3>
                            <Badge variant={source.connectionStatus === 'connected' ? 'default' : 'destructive'}>
                              {source.connectionStatus}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {source.description}
                          </p>
                          <div className="flex items-center text-xs mt-2">
                            <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span>{source.latitude}, {source.longitude}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="charts" className="flex-1 mt-6 flex flex-col overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
            <div className="lg:col-span-1 flex flex-col">
              {selectedSource ? (
                <Card className="flex-1 flex flex-col">
                  <CardHeader>
                    <CardTitle>{selectedSource.name} - Real-time Data</CardTitle>
                    <CardDescription>{selectedSource.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pb-4">
                    <RealTimeChart
                      dataSourceId={selectedSource.id}
                      title={selectedSource.name}
                      yAxisLabel={selectedSource.unit || 'Value'}
                      color="hsl(var(--chart-2))"
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground">
                  <p>Click on a data source marker on the map to view its real-time chart.</p>
                </Card>
              )}
            </div>
            <div className="lg:col-span-1 flex flex-col">
              <Card className="flex-1 flex flex-col">
                <CardHeader>
                  <CardTitle>Data Source List</CardTitle>
                  <CardDescription>
                    Browse and manage all your data sources.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  <ScrollArea className="h-full pr-4">
                    <ul className="space-y-4">
                      {dataSources.map(source => (
                        <li key={source.id} className="border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleMarkerClick(source)}>
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold">{source.name}</h3>
                            <Badge variant={source.connectionStatus === 'connected' ? 'default' : 'destructive'}>
                              {source.connectionStatus}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {source.description}
                          </p>
                          <div className="flex items-center text-xs mt-2">
                            <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                            <span>{source.latitude}, {source.longitude}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}