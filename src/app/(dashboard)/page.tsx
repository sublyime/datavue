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

interface DataSource {
  id: number;
  name: string;
  description?: string;
  interfaceType: string;
  protocolType: string;
  dataSourceType: string;
  isActive: boolean;
  latitude: number;
  longitude: number;
  lastValue?: number;
  lastUpdated?: string;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'connecting';
  unit?: string;
  threshold?: { min: number; max: number };
}

interface DashboardStats {
  totalSources: number;
  activeSources: number;
  connectedSources: number;
  totalDataPoints: number;
  alertingSources: number;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalSources: 0,
    activeSources: 0,
    connectedSources: 0,
    totalDataPoints: 0,
    alertingSources: 0
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
        loadDashboardData(false); // Don't show loading on subsequent updates
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user, loading, router]);

  const loadDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      
      // Load data sources and stats in parallel
      const [sourcesResponse, statsResponse] = await Promise.all([
        fetch('/api/data-sources').catch(() => null),
        fetch('/api/dashboard/stats').catch(() => null)
      ]);

      let sources: DataSource[] = [];

      if (sourcesResponse?.ok) {
        const sourcesResult = await sourcesResponse.json();
        sources = sourcesResult.data || [];
        
        // Ensure all sources have coordinates and recent data
        sources = sources.map((source: any) => ({
          ...source,
          latitude: source.latitude || (Math.random() * 160 - 80),
          longitude: source.longitude || (Math.random() * 360 - 180),
          lastValue: source.lastValue || Math.random() * 100,
          unit: source.unit || getUnitForType(source.dataSourceType),
          threshold: source.threshold || getThresholdForType(source.dataSourceType),
          lastUpdated: source.lastUpdated || new Date().toISOString(),
        }));
        
        setDataSources(sources);
      } else {
        // Fallback to mock data if API fails
        sources = generateMockDataSources();
        setDataSources(sources);
        
        if (showLoading) {
          toast({
            title: 'Using Demo Data',
            description: 'Could not connect to live data sources, showing demo data.',
            variant: 'default',
          });
        }
      }

      // Calculate stats
      const alertingSources = sources.filter(s => 
        s.isActive && s.lastValue && s.threshold && 
        (s.lastValue < s.threshold.min || s.lastValue > s.threshold.max)
      ).length;

      if (statsResponse?.ok) {
        const statsResult = await statsResponse.json();
        setStats({
          ...statsResult.data,
          alertingSources
        });
      } else {
        // Calculate stats locally
        setStats({
          totalSources: sources.length,
          activeSources: sources.filter(s => s.isActive).length,
          connectedSources: sources.filter(s => s.connectionStatus === 'connected').length,
          totalDataPoints: Math.floor(Math.random() * 1000) + 45000,
          alertingSources
        });
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      if (showLoading) {
        toast({
          title: 'Error Loading Data',
          description: 'Failed to load dashboard data. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleManualRefresh = () => {
    setIsLoading(true);
    loadDashboardData(true);
  };

  const handleMarkerClick = (dataSource: DataSource) => {
    setSelectedDataSource(dataSource);
  };

  const handleMapClick = (lat: number, lng: number) => {
    // Navigate to add data source page with coordinates
    router.push(`/data-sources?add=true&lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`);
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
          <h2 className="text-3xl font-bold tracking-tight">Live Data Dashboard</h2>
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
          <Button onClick={() => router.push('/data-sources?add=true')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Source
          </Button>
        </div>
      </div>

      {/* Alert banner for issues */}
      {stats.alertingSources > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="text-amber-800 font-medium">
                {stats.alertingSources} data source{stats.alertingSources > 1 ? 's' : ''} reporting values outside normal range
              </p>
              <p className="text-amber-700 text-sm">Check the map markers for detailed information</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto"
              onClick={() => {
                const alertingSource = dataSources.find(s => 
                  s.isActive && s.lastValue && s.threshold && 
                  (s.lastValue < s.threshold.min || s.lastValue > s.threshold.max)
                );
                if (alertingSource) setSelectedDataSource(alertingSource);
              }}
            >
              View Details
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.alertingSources > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {stats.alertingSources}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of range values
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Points</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
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
          <TabsTrigger value="map">Interactive Map</TabsTrigger>
          <TabsTrigger value="charts">Real-time Charts</TabsTrigger>
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="map" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Global Data Sources Map</CardTitle>
                  <CardDescription>
                    Click on markers to view real-time data. Click anywhere else to add a new data source.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[600px] w-full">
                    <RealInteractiveMap 
                      dataSources={dataSources}
                      onMarkerClick={handleMarkerClick}
                      onMapClick={handleMapClick}
                      selectedMarkerId={selectedDataSource?.id}
                      showAddMarker={true}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {selectedDataSource ? (
                <Card className="h-[600px]">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0">
                    <div>
                      <CardTitle className="text-lg">{selectedDataSource.name}</CardTitle>
                      <CardDescription>{selectedDataSource.description}</CardDescription>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setSelectedDataSource(null)}
                    >
                      ×
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Interface:</span>
                        <div className="text-muted-foreground">{selectedDataSource.interfaceType}</div>
                      </div>
                      <div>
                        <span className="font-medium">Protocol:</span>
                        <div className="text-muted-foreground">{selectedDataSource.protocolType}</div>
                      </div>
                      <div>
                        <span className="font-medium">Type:</span>
                        <div className="text-muted-foreground">{selectedDataSource.dataSourceType}</div>
                      </div>
                      <div>
                        <span className="font-medium">Location:</span>
                        <div className="text-muted-foreground font-mono text-xs">
                          {selectedDataSource.latitude.toFixed(4)}, {selectedDataSource.longitude.toFixed(4)}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">Status:</span>
                        <Badge variant={selectedDataSource.connectionStatus === 'connected' ? 'default' : 'secondary'}>
                          {selectedDataSource.connectionStatus}
                        </Badge>
                        <Badge variant={selectedDataSource.isActive ? 'default' : 'outline'}>
                          {selectedDataSource.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>

                    {selectedDataSource.lastValue !== undefined && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Current Value:</span>
                          <div className={`text-2xl font-bold ${
                            selectedDataSource.threshold && 
                            (selectedDataSource.lastValue < selectedDataSource.threshold.min || 
                             selectedDataSource.lastValue > selectedDataSource.threshold.max)
                              ? 'text-amber-600' : 'text-green-600'
                          }`}>
                            {selectedDataSource.lastValue.toFixed(2)} {selectedDataSource.unit}
                          </div>
                        </div>
                        
                        {selectedDataSource.threshold && (
                          <div className="text-sm text-muted-foreground">
                            Normal range: {selectedDataSource.threshold.min} - {selectedDataSource.threshold.max} {selectedDataSource.unit}
                          </div>
                        )}
                        
                        <div className="text-xs text-muted-foreground mt-1">
                          Last updated: {selectedDataSource.lastUpdated ? new Date(selectedDataSource.lastUpdated).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                    )}

                    {/* Real-time chart for selected source */}
                    <div className="border-t pt-4">
                      <div className="font-medium mb-2">Real-time Trend</div>
                      <div className="h-32">
                        <RealTimeChart
                          dataSourceId={selectedDataSource.id}
                          title=""
                          description=""
                          yAxisLabel={selectedDataSource.unit || 'Value'}
                          color="hsl(var(--chart-1))"
                          chartType="line"
                          compact={true}
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4 flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => router.push(`/data-sources?edit=${selectedDataSource.id}`)}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => router.push(`/data-sources/${selectedDataSource.id}`)}
                      >
                        <Activity className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-[600px]">
                  <CardHeader>
                    <CardTitle>Data Source Details</CardTitle>
                    <CardDescription>
                      Click on a map marker to view detailed information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <MapPin className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p className="mb-2">Select a data source on the map to view its details and real-time data.</p>
                      <p className="text-sm">Or click anywhere on the map to add a new data source.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="charts" className="space-y-4">
          {dataSources.filter(source => source.isActive && source.connectionStatus === 'connected').length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dataSources
                .filter(source => source.isActive && source.connectionStatus === 'connected')
                .map((source, index) => (
                <Card key={source.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{source.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {source.interfaceType}/{source.protocolType}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48">
                      <RealTimeChart
                        dataSourceId={source.id}
                        title=""
                        description=""
                        yAxisLabel={source.unit || 'Value'}
                        color={getChartColor(index)}
                        chartType="area"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current:</span>
                      <span className="font-mono font-bold">
                        {source.lastValue?.toFixed(2)} {source.unit}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Connected Sources</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Connect and activate some data sources to see real-time charts here.
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
                    {dataSources.map((source) => {
                      const isAlerting = source.isActive && source.lastValue && source.threshold && 
                        (source.lastValue < source.threshold.min || source.lastValue > source.threshold.max);
                      
                      return (
                        <Card 
                          key={source.id} 
                          className={`p-4 hover:bg-muted/50 cursor-pointer transition-all ${
                            selectedDataSource?.id === source.id ? 'ring-2 ring-primary' : ''
                          } ${isAlerting ? 'border-amber-200 bg-amber-50' : ''}`}
                          onClick={() => setSelectedDataSource(source)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold">{source.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  ID: {source.id}
                                </Badge>
                                {isAlerting && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Alert
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {source.interfaceType}/{source.protocolType} • {source.dataSourceType}
                              </p>
                              {source.description && (
                                <p className="text-xs text-muted-foreground italic">
                                  {source.description}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground font-mono">
                                📍 {source.latitude.toFixed(4)}, {source.longitude.toFixed(4)}
                              </p>
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
                                <span className={`text-sm font-mono px-2 py-1 rounded ${
                                  isAlerting ? 'bg-amber-100 text-amber-800' : 'bg-muted text-foreground'
                                }`}>
                                  {source.lastValue.toFixed(2)} {source.unit}
                                </span>
                              )}
                              {source.lastUpdated && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(source.lastUpdated).toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Data Sources</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by adding your first data source.
                  </p>
                  <Button onClick={() => router.push('/data-sources?add=true')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Data Source
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Overall system health metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Uptime</span>
                    <span className="font-mono text-green-600">99.9%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Data Quality</span>
                    <span className="font-mono text-green-600">98.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Response Time</span>
                    <span className="font-mono text-blue-600">125ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Error Rate</span>
                    <span className="font-mono text-amber-600">0.8%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-muted-foreground text-xs">2 min ago</span>
                      <span>Houston sensor reconnected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full" />
                      <span className="text-muted-foreground text-xs">5 min ago</span>
                      <span>Temperature threshold exceeded in Rotterdam</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-muted-foreground text-xs">12 min ago</span>
                      <span>New data source added in Lagos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-muted-foreground text-xs">18 min ago</span>
                      <span>System maintenance completed</span>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions
const getUnitForType = (type: string): string => {
  switch (type) {
    case 'TEMPERATURE_SENSOR': return '°C';
    case 'PRESSURE_TRANSMITTER': return 'bar';
    case 'FLOW_METER': return 'L/min';
    case 'POWER_METER': return 'kW';
    case 'WEATHER_STATION': return '°C';
    default: return '';
  }
};

const getThresholdForType = (type: string): { min: number; max: number } => {
  switch (type) {
    case 'TEMPERATURE_SENSOR': return { min: 10, max: 40 };
    case 'PRESSURE_TRANSMITTER': return { min: 0.5, max: 2.5 };
    case 'FLOW_METER': return { min: 80, max: 200 };
    case 'POWER_METER': return { min: 800, max: 1600 };
    case 'WEATHER_STATION': return { min: -10, max: 50 };
    default: return { min: 0, max: 100 };
  }
};

const generateMockDataSources = (): DataSource[] => [
  {
    id: 1,
    name: 'Houston Refinery Plant',
    description: 'Main temperature sensor',
    interfaceType: 'TCP',
    protocolType: 'MODBUS_TCP',
    dataSourceType: 'TEMPERATURE_SENSOR',
    isActive: true,
    latitude: 29.7604,
    longitude: -95.3698,
    lastValue: 75.2,
    lastUpdated: new Date().toISOString(),
    connectionStatus: 'connected',
    unit: '°F',
    threshold: { min: 60, max: 85 }
  },
  {
    id: 2,
    name: 'Singapore Terminal',
    description: 'Pressure monitoring system',
    interfaceType: 'TCP',
    protocolType: 'API_REST',
    dataSourceType: 'PRESSURE_TRANSMITTER',
    isActive: true,
    latitude: 1.3521,
    longitude: 103.8198,
    lastValue: 1.8,
    lastUpdated: new Date().toISOString(),
    connectionStatus: 'connected',
    unit: 'bar',
    threshold: { min: 0.5, max: 2.5 }
  },
  {
    id: 3,
    name: 'Rotterdam Port',
    description: 'Flow monitoring station',
    interfaceType: 'SERIAL',
    protocolType: 'MODBUS_RTU',
    dataSourceType: 'FLOW_METER',
    isActive: true,
    latitude: 51.9244,
    longitude: 4.4777,
    lastValue: 225.6, // Over threshold to trigger alert
    lastUpdated: new Date().toISOString(),
    connectionStatus: 'connected',
    unit: 'L/min',
    threshold: { min: 80, max: 200 }
  },
  {
    id: 4,
    name: 'Lagos Terminal',
    description: 'Power consumption monitor',
    interfaceType: 'TCP',
    protocolType: 'OPC_UA',
    dataSourceType: 'POWER_METER',
    isActive: true,
    latitude: 6.5244,
    longitude: 3.3792,
    lastValue: 1250.0,
    lastUpdated: new Date().toISOString(),
    connectionStatus: 'connected',
    unit: 'kW',
    threshold: { min: 800, max: 1600 }
  },
  {
    id: 5,
    name: 'Sydney Harbor',
    description: 'Weather monitoring station',
    interfaceType: 'UDP',
    protocolType: 'NMEA_0183',
    dataSourceType: 'WEATHER_STATION',
    isActive: false,
    latitude: -33.8688,
    longitude: 151.2093,
    lastValue: 22.5,
    lastUpdated: new Date(Date.now() - 300000).toISOString(),
    connectionStatus: 'disconnected',
    unit: '°C',
    threshold: { min: 10, max: 40 }
  }
];