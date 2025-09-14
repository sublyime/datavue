// src/components/real-time-chart.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface ChartDataPoint {
  time: string;
  value: number;
  timestamp: number;
}

interface RealTimeChartProps {
  dataSourceId: number;
  title?: string;
  description?: string;
  yAxisLabel?: string;
  color?: string;
  chartType?: 'line' | 'area';
  compact?: boolean;
  maxDataPoints?: number;
  updateInterval?: number;
}

export const RealTimeChart: React.FC<RealTimeChartProps> = ({
  dataSourceId,
  title = 'Real-time Data',
  description = 'Live data stream',
  yAxisLabel = 'Value',
  color = 'hsl(var(--chart-1))',
  chartType = 'line',
  compact = false,
  maxDataPoints = 20,
  updateInterval = 3000,
}) => {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLive, setIsLive] = useState(true);

  // Generate realistic mock data for the data source
  const generateDataPoint = (previousValue?: number): ChartDataPoint => {
    const now = new Date();
    const baseValue = getBaseValueForDataSource(dataSourceId);
    const variation = getVariationForDataSource(dataSourceId);
    
    // Create realistic data progression
    let newValue;
    if (previousValue !== undefined) {
      // Add some trend and noise
      const trend = (Math.random() - 0.5) * 0.1;
      const noise = (Math.random() - 0.5) * variation;
      newValue = Math.max(0, previousValue + trend + noise);
    } else {
      newValue = baseValue + (Math.random() - 0.5) * variation;
    }

    return {
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      value: Number(newValue.toFixed(2)),
      timestamp: now.getTime(),
    };
  };

  // Initialize with some historical data
  useEffect(() => {
    const initialData: ChartDataPoint[] = [];
    const now = Date.now();
    
    // Generate last 10 data points
    for (let i = 9; i >= 0; i--) {
      const timestamp = now - (i * updateInterval);
      const date = new Date(timestamp);
      const baseValue = getBaseValueForDataSource(dataSourceId);
      const variation = getVariationForDataSource(dataSourceId);
      
      initialData.push({
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        value: Number((baseValue + (Math.random() - 0.5) * variation).toFixed(2)),
        timestamp,
      });
    }
    
    setData(initialData);
  }, [dataSourceId, updateInterval]);

  // Real-time updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setData(prevData => {
        const lastValue = prevData.length > 0 ? prevData[prevData.length - 1].value : undefined;
        const newPoint = generateDataPoint(lastValue);
        const newData = [...prevData, newPoint];
        
        // Keep only the last maxDataPoints
        if (newData.length > maxDataPoints) {
          return newData.slice(-maxDataPoints);
        }
        
        return newData;
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [isLive, maxDataPoints, updateInterval]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium">{`Time: ${label}`}</p>
          <p className="text-sm" style={{ color: payload[0].color }}>
            {`${yAxisLabel}: ${payload[0].value}`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (compact) {
    return (
      <div className="w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`gradient-${dataSourceId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill={`url(#gradient-${dataSourceId})`}
                dot={false}
                activeDot={{ r: 3, stroke: color, strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, stroke: color, strokeWidth: 2 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              isLive 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isLive ? '● LIVE' : '⏸ PAUSED'}
          </button>
          <span className="text-xs text-muted-foreground">
            {data.length > 0 ? data[data.length - 1].value : '--'} {yAxisLabel}
          </span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="85%">
        {chartType === 'area' ? (
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id={`gradient-${dataSourceId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${dataSourceId})`}
              dot={false}
              activeDot={{ r: 4, stroke: color, strokeWidth: 2 }}
            />
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: color, strokeWidth: 2 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

// Helper functions to generate realistic data based on data source type
const getBaseValueForDataSource = (dataSourceId: number): number => {
  // Different base values for different data sources
  const baseValues: { [key: number]: number } = {
    1: 75,    // Houston - Temperature in °F
    2: 1.8,   // Singapore - Pressure in bar
    3: 125,   // Rotterdam - Flow in L/min
    4: 1250,  // Lagos - Power in kW
    5: 22,    // Sydney - Temperature in °C
  };
  
  return baseValues[dataSourceId] || 50;
};

const getVariationForDataSource = (dataSourceId: number): number => {
  // Different variation ranges for different data sources
  const variations: { [key: number]: number } = {
    1: 10,    // Houston - ±5°F variation
    2: 0.4,   // Singapore - ±0.2 bar variation
    3: 30,    // Rotterdam - ±15 L/min variation
    4: 200,   // Lagos - ±100 kW variation
    5: 8,     // Sydney - ±4°C variation
  };
  
  return variations[dataSourceId] || 10;
};

export default RealTimeChart;