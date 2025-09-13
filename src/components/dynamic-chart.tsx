'use client';

import { useState, useEffect, useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type DataPoint = {
  time: string;
  value: number;
};

interface DynamicChartProps {
  title: string;
  description: string;
  yAxisLabel: string;
  initialData?: DataPoint[];
  color: string;
}

export function DynamicChart({
  title,
  description,
  yAxisLabel,
  initialData = [],
  color,
}: DynamicChartProps) {
  const [data, setData] = useState<DataPoint[]>(initialData);

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prevData) => {
        const lastDataPoint = prevData[prevData.length - 1];
        const newValue =
          lastDataPoint.value + (Math.random() - 0.5) * (lastDataPoint.value / 50);

        const newTime = parseInt(lastDataPoint.time) + 1;

        const newDataPoint: DataPoint = {
          time: newTime.toString(),
          value: parseFloat(newValue.toFixed(2)),
        };

        const newDataSet = [...prevData, newDataPoint];
        if (newDataSet.length > 20) {
          newDataSet.shift();
        }
        return newDataSet;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const chartColor = color;

  const chartConfig = {
    value: {
      label: yAxisLabel,
      color: chartColor,
    },
  } satisfies ChartConfig;


  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id={`color-${yAxisLabel}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="time" tick={{ fill: 'hsl(var(--muted-foreground))' }} fontSize={12} axisLine={false} tickLine={false} />
              <YAxis
                label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', fontSize: 12, dx: -5 }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                fontSize={12}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#color-${yAxisLabel})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
