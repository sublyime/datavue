'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/providers'; // Changed from useSupabase
import dynamic from 'next/dynamic';

const MapContent = dynamic(() => import('@/components/map-content'), {
  ssr: false,
});

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

export default function DashboardPage() {
  const { user, loading } = useAuth(); // Use useAuth instead of useSupabase
  const router = useRouter();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      // Mock data for now - replace with actual API call
      setDataSources([
        {
          id: 1,
          name: 'Houston Plant',
          description: 'Main production facility',
          interfaceType: 'TCP',
          protocolType: 'Modbus',
          dataSourceType: 'PLC',
          isActive: true,
          latitude: 29.7604,
          longitude: -95.3698,
          connectionStatus: 'connected',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Singapore Terminal',
          description: 'Asian operations center',
          interfaceType: 'MQTT',
          protocolType: 'JSON',
          dataSourceType: 'IoT',
          isActive: true,
          latitude: 1.3521,
          longitude: 103.8198,
          connectionStatus: 'connected',
          lastUpdated: new Date().toISOString(),
        },
      ]);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="h-full">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Welcome back, {user.email}
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-2">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add New Source
            </Button>
          </div>
        </div>
        <div className="h-[600px]">
          {isClient && (
            <MapContent
              dataSources={dataSources}
              onMapClick={(lat, lng) => console.log('Map clicked:', lat, lng)}
              onDataSourceClick={(ds) => console.log('Data source clicked:', ds)}
              onDeleteDataSource={(id) => console.log('Delete data source:', id)}
              onToggleActive={(id, active) => console.log('Toggle active:', id, active)}
            />
          )}
        </div>
      </div>
    </div>
  );
}