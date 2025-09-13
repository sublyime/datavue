import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MapPlaceholder } from '@/components/map-placeholder';
import { DynamicChart } from '@/components/dynamic-chart';

export default function DashboardPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time visualization of your data streams.
        </p>
      </header>
      <div className="grid flex-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 flex flex-col md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Live Asset Map</CardTitle>
            <CardDescription>
              Geospatial distribution of active data sources.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <MapPlaceholder />
          </CardContent>
        </Card>

        <DynamicChart
          title="Vibration Frequency"
          description="Turbine A-1"
          yAxisLabel="Hz"
          initialData={[
            { time: '1', value: 50 },
            { time: '2', value: 51 },
            { time: '3',value: 49 },
          ]}
          color="hsl(var(--chart-1))"
        />

        <DynamicChart
          title="Flow Rate"
          description="Main Pipeline"
          yAxisLabel="m³/s"
          initialData={[
            { time: '1', value: 120 },
            { time: '2', value: 122 },
            { time: '3',value: 118 },
          ]}
          color="hsl(var(--chart-2))"
        />
        
        <DynamicChart
          title="Temperature"
          description="Reactor Core"
          yAxisLabel="°C"
          initialData={[
            { time: '1', value: 850 },
            { time: '2', value: 852 },
            { time: '3',value: 849 },
          ]}
          color="hsl(var(--destructive))"
        />
      </div>
    </div>
  );
}
