'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Settings, TrendingUp, Database, Zap, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RealInteractiveMap } from '@/components/real-interactive-map';
import { DynamicChart } from '@/components/dynamic-chart';
import { useAuth } from '@/components/providers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { apiClient } from '@/lib/api-client';

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
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user) {
      loadDataSources();
    }
  }, [user, loading, router]);

  const loadDataSources = async () => {
    setIsLoading(true);
    try {
      const result = await apiClient.getDataSources();
      const sourcesWithCoords = result.data.map((source: any) => ({
        ...source,
        latitude: source.latitude || (Math.random() * 160 - 80),
        longitude: source.longitude || (Math.random() * 360 - 180),
      }));
      setDataSources(sourcesWithCoords);
    } catch (error) {
      console.error('Failed to load data sources:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMarkerClick = (dataSource: DataSource) => {
    setSelectedDataSource(dataSource);
  };

  const handleMapClick = (lat: number, lng: number) => {
    router.push(`/data-sources?add=true&lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}`);
  };

  if (loading || isLoading) {
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
          <Button onClick={() => router.push('/data-sources?add=true')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Source
          </Button>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="map" className="space-y-4">
        <TabsList>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="sources">Sources List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interactive World Map</CardTitle>
              <CardDescription>
                Click on a marker to view details, or click on the map to add a new source.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[600px]">
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
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {dataSources.map((source) => (
                    <Card key={source.id} className="p-4 hover:bg-muted/50 cursor-pointer" onClick={() => handleMarkerClick(source)}>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {source.name}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {source.interfaceType}/{source.protocolType} • {source.dataSourceType}
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
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {dataSources.length === 0 && !isLoading && (
                    <div className="text-center py-12">
                      <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Data Sources Found</h3>
                      <p className="text-muted-foreground mb-4">
                        Get started by adding your first data source.
                      </p>
                      <Button onClick={() => router.push('/data-sources?add=true')}>
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
                    color="hsl(var(--chart-3))"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
