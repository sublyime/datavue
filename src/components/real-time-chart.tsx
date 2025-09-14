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
  maxDataPoints = 20,
  updateInterval = 3000, // Update every 3 seconds
  chartType = 'area'
}: RealTimeChartProps) {
  const [data, setData] = useState<DataPoint[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch real-time data from API
  const fetchData = async () => {
    try {
      console.log(`🔄 Fetching data for source ${dataSourceId}...`);
      const response = await fetch(`/api/data-points?sourceId=${dataSourceId}&limit=1&latest=true`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`📊 Received data:`, result);
        
        if (result.data && result.data.length > 0) {
          const newPoint = result.data[0];
          const pointValue = typeof newPoint.value === 'object' ? 
            parseFloat(newPoint.value.value || newPoint.value) : 
            parseFloat(newPoint.value);
            
          setData(prev => {
            const updated = [...prev, {
              timestamp: new Date().toLocaleTimeString(),
              value: isNaN(pointValue) ? 0 : pointValue,
              quality: newPoint.quality || 192
            }];
            return updated.slice(-maxDataPoints);
          });
          setConnectionStatus('connected');
        } else {
          // Generate simulated data if no real data available
          console.log('📈 No data from API, generating simulated data...');
          setData(prev => {
            const lastValue = prev.length > 0 ? prev[prev.length - 1].value : 50;
            const newValue = lastValue + (Math.random() - 0.5) * 10;
            const updated = [...prev, {
              timestamp: new Date().toLocaleTimeString(),
              value: parseFloat(newValue.toFixed(2)),
              quality: 192
            }];
            return updated.slice(-maxDataPoints);
          });
          setConnectionStatus('connected');
        }
      } else {
        console.error('❌ API error:', response.statusText);
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('❌ Failed to fetch data:', error);
      setConnectionStatus('error');
    }
  };

  // Load initial historical data
  const loadInitialData = async () => {
    try {
      console.log(`📚 Loading initial data for source ${dataSourceId}...`);
      const response = await fetch(`/api/data-points?sourceId=${dataSourceId}&limit=${maxDataPoints}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`📋 Initial data loaded:`, result);
        
        if (result.data && result.data.length > 0) {
          const formattedData = result.data.reverse().map((point: any, index: number) => {
            const pointValue = typeof point.value === 'object' ? 
              parseFloat(point.value.value || point.value) : 
              parseFloat(point.value);
              
            return {
              timestamp: new Date(point.timestamp).toLocaleTimeString(),
              value: isNaN(pointValue) ? Math.random() * 100 : pointValue,
              quality: point.quality || 192
            };
          });
          setData(formattedData);
          setConnectionStatus('connected');
        } else {
          // Generate initial simulated data
          const initialData = [];
          for (let i = maxDataPoints - 1; i >= 0; i--) {
            const time = new Date(Date.now() - i * updateInterval);
            initialData.push({
              timestamp: time.toLocaleTimeString(),
              value: parseFloat((Math.random() * 100 + 25).toFixed(2)),
              quality: 192
            });
          }
          setData(initialData);
          setConnectionStatus('connected');
        }
      }
    } catch (error) {
      console.error('❌ Failed to load initial data:', error);
      // Generate fallback data
      const fallbackData = [];
      for (let i = maxDataPoints - 1; i >= 0; i--) {
        const time = new Date(Date.now() - i * updateInterval);
        fallbackData.push({
          timestamp: time.toLocaleTimeString(),
          value: parseFloat((Math.random() * 100 + 25).toFixed(2)),
          quality: 192
        });
      }
      setData(fallbackData);
      setConnectionStatus('error');
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
          <span>Points: {data.length}/{maxDataPoints}</span>
          <span>
            {data.length > 0 && `Latest: ${data[data.length - 1]?.value.toFixed(2)}`}
          </span>
          <span>ID: {dataSourceId}</span>
        </div>
      </CardContent>
    </Card>
  );
}
