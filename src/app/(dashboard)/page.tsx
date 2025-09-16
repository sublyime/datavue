'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Settings, TrendingUp, Database, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RealTimeChart } from '@/components/real-time-chart';
import { useSupabase } from '@/components/providers';
import { DataSource } from '@/lib/types/data-sources'; // Ensure this path is correct
import dynamic from 'next/dynamic';

const MapContent = dynamic(() => import('@/components/map-content'), {
  ssr: false,
});

export default function DashboardPage() {
  const supabase = useSupabase() as any;
  const router = useRouter();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch data sources or other relevant data
      const { data, error } = await supabase.from('data_sources').select('*');
      if (error) {
        console.error('Error fetching data sources:', error);
      } else {
        setDataSources(data || []);
      }
      setLoading(false);
    };

    fetchUserAndData();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
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
