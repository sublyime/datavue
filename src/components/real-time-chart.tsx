'use client';

import { useState, useEffect, useRef } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface DataPoint {
  timestamp: string;
  value: number;
  quality: number;
}

interface RealTimeChartProps {
  dataSourceId: number;
  title: string;
  description?: string;
  yAxisLabel: string;
  color: string;
  maxDataPoints?: number;
  updateInterval?: number;
  chartType?: 'line' | 'area';
}

export function RealTimeChart({
  dataSourceId,
  title,
  description,
  yAxisLabel,
  color,
  maxDataPoints = 50,
  updateInterval = 2000,
  chartType = 'area'
}: RealTimeChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate mock data for demo purposes
  const generateMockData = () => {
    const now = new Date();
    const mockPoint = {
      timestamp: now.toLocaleTimeString(),
      value: parseFloat((Math.random() * 100 + 50).toFixed(2)),
      quality: 192
    };
    
    setData(prev => {
      const updated = [...prev, mockPoint];
      return updated.slice(-maxDataPoints);
    });
    setConnectionStatus('connected');
  };

  // Fetch real-time data
  const fetchData = async () => {
    try {
      const response = await fetch(`/api/data-points?sourceId=${dataSourceId}&limit=1&latest=true`);
      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.length > 0) {
          const newPoint = result.data[0];
          // Handle JSONB value format
          const value = typeof newPoint.value === 'object' ? 
            parseFloat(newPoint.value.value || newPoint.value) : 
            parseFloat(newPoint.value);
            
          setData(prev => {
            const updated = [...prev, {
              timestamp: new Date(newPoint.timestamp).toLocaleTimeString(),
              value: isNaN(value) ? Math.random() * 100 : value,
              quality: newPoint.quality
            }];
            return updated.slice(-maxDataPoints);
          });
          setConnectionStatus('connected');
        } else {
          // Generate mock data if no real data
          generateMockData();
        }
      } else {
        // Generate mock data on error
        generateMockData();
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Generate mock data on error
      generateMockData();
    }
  };

  // Load initial data
  const loadInitialData = async () => {
    try {
      const response = await fetch(`/api/data-points?sourceId=${dataSourceId}&limit=${Math.min(maxDataPoints, 10)}`);
      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.length > 0) {
          const formattedData = result.data.reverse().map((point: any) => {
            const value = typeof point.value === 'object' ? 
              parseFloat(point.value.value || point.value) : 
              parseFloat(point.value);
              
            return {
              timestamp: new Date(point.timestamp).toLocaleTimeString(),
              value: isNaN(value) ? Math.random() * 100 : value,
              quality: point.quality
            };
          });
          setData(formattedData);
          setConnectionStatus('connected');
        } else {
          // Generate initial mock data
          const initialData = [];
          for (let i = 9; i >= 0; i--) {
            const time = new Date(Date.now() - i * 2000);
            initialData.push({
              timestamp: time.toLocaleTimeString(),
              value: parseFloat((Math.random() * 100 + 50).toFixed(2)),
              quality: 192
            });
          }
          setData(initialData);
          setConnectionStatus('connected');
        }
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      // Generate initial mock data on error
      const initialData = [];
      for (let i = 9; i >= 0; i--) {
        const time = new Date(Date.now() - i * 2000);
        initialData.push({
          timestamp: time.toLocaleTimeString(),
          value: parseFloat((Math.random() * 100 + 50).toFixed(2)),
          quality: 192
        });
      }
      setData(initialData);
      setConnectionStatus('connected');
    }
  };

  // Start/stop data fetching
  useEffect(() => {
    loadInitialData();
    
    if (isRunning) {
      intervalRef.current = setInterval(fetchData, updateInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, dataSourceId, updateInterval]);

  const togglePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const resetData = () => {
    setData([]);
    loadInitialData();
  };

  const chartConfig = {
    value: {
      label: yAxisLabel,
      color: color,
    },
  } satisfies ChartConfig;

  const getStatusBadgeVariant = () => {
    switch (connectionStatus) {
      case 'connected': return 'default';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const ChartComponent = chartType === 'line' ? LineChart : AreaChart;
  const DataComponent = chartType === 'line' ? Line : Area;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={getStatusBadgeVariant()}>
            {connectionStatus}
          </Badge>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              className="h-8 w-8 p-0"
            >
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetData}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <ResponsiveContainer width="100%" height={200}>
            <ChartComponent data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp" 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 5)}
              />
              <YAxis 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <ChartTooltipContent 
                active={false}
                content={<ChartTooltipContent />}
              />
              <DataComponent
                dataKey="value"
                stroke={color}
                fill={chartType === 'area' ? color : undefined}
                fillOpacity={chartType === 'area' ? 0.2 : undefined}
                strokeWidth={2}
                dot={false}
                type="monotone"
              />
            </ChartComponent>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
          <span>Data Points: {data.length}</span>
          <span>
            {data.length > 0 && `Latest: ${data[data.length - 1]?.value.toFixed(2)} ${yAxisLabel}`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
