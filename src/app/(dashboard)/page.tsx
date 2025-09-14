'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Settings, TrendingUp, Database, Zap, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RealInteractiveMap } from '@/components/real-interactive-map';
import { RealTimeChart } from '@/components/real-time-chart';
import { useAuth } from '@/components/providers';
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
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'connecting';
  lastUpdated?: string;
}

interface DashboardStats {
  totalSources: number;
  activeSources: number;
  connectedSources: number;
  totalDataPoints: number;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalSources: 0,
    activeSources: 0,
    connectedSources: 0,
    totalDataPoints: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      loadDashboardData();
      
      // Set up real-time updates every 30 seconds
      const interval = setInterval(() => {
        loadDashboardData();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, loading, router]);

  const loadDashboardData = async () => {
    try {
      // Load data sources and stats in parallel
      const [sourcesResponse, statsResponse] = await Promise.all([
        fetch('/api/data-sources'),
        fetch('/api/dashboard/stats')
      ]);

      if (sourcesResponse.ok) {
        const sourcesResult = await sourcesResponse.json();
        setDataSources(sourcesResult.data || []);
      }

      if (statsResponse.ok) {
        const statsResult = await statsResponse.json();
        setStats(statsResult.data);
      } else {
        // Fallback to calculated stats if API fails
        const sources = dataSources;
        setStats({
          totalSources: sources.length,
          activeSources: sources.filter(s => s.isActive).length,
          connectedSources: sources.filter(s => s.connectionStatus === 'connected').length,
          totalDataPoints: 0 // Will be loaded separately
        });
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRefresh = () => {
    setIsLoading(true);
    loadDashboardData();
  };

  const getChartColor = (index: number) => {
    const colors = [
      'hsl(var(--chart-1))', 
      'hsl(var(--chart-2))', 
      'hsl(var(--chart-3))', 
      'hsl(var(--chart-4))', 
      'hsl(var(--chart-5))'
    ];
    return colors[index % colors.length];
  };

  if (loading || (isLoading && dataSources.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold">Loading Dashboard</h3>
          <p className="text-muted-foreground">Fetching your data sources and analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back, {user?.name} • Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleManualRefresh} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => router.push('/data-sources')} variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Manage Sources
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSources}</div>
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
            <div className="text-2xl font-bold">{stats.activeSources}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSources > 0 ? Math.round((stats.activeSources / stats.totalSources) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.connectedSources}</div>
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
            <div className="text-2xl font-bold">{stats.totalDataPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total collected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="map" className="space-y-4">
        <TabsList>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="charts">Real-time Charts</TabsTrigger>
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Map</CardTitle>
              <CardDescription>
                Click anywhere on the map to add a new data source. 
                Click on markers to view details and manage existing sources.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[700px] w-full">
                <RealInteractiveMap />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="charts" className="space-y-4">
          {dataSources.filter(source => source.isActive).length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dataSources.filter(source => source.isActive).map((source, index) => (
                <RealTimeChart
                  key={source.id}
                  dataSourceId={source.id}
                  title={source.name}
                  description={`${source.interfaceType}/${source.protocolType}`}
                  yAxisLabel="Value"
                  color={getChartColor(index)}
                  chartType="area"
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Data Sources</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Activate some data sources to see real-time charts here.
                </p>
                <Button onClick={() => router.push('/data-sources')}>
                  <Database className="h-4 w-4 mr-2" />
                  Manage Data Sources
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Sources ({dataSources.length})</CardTitle>
              <CardDescription>
                Overview of all configured data sources and their current status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dataSources.length > 0 ? (
                <ScrollArea className="h-[500px] w-full">
                  <div className="space-y-4">
                    {dataSources.map((source) => (
                      <Card key={source.id} className="p-4 hover:bg-muted/50 cursor-pointer">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold">{source.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                ID: {source.id}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {source.interfaceType}/{source.protocolType} • {source.dataSourceType}
                            </p>
                            {source.description && (
                              <p className="text-xs text-muted-foreground italic">
                                {source.description}
                              </p>
                            )}
                            {source.latitude && source.longitude && (
                              <p className="text-xs text-muted-foreground font-mono">
                                📍 {source.latitude.toFixed(4)}, {source.longitude.toFixed(4)}
                              </p>
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
                            {source.lastUpdated && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(source.lastUpdated).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Data Sources</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by adding your first data source on the map.
                  </p>
                  <Button onClick={() => router.push('/data-sources')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Data Source
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
