'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Settings, TrendingUp, Database, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InteractiveMap } from '@/components/interactive-map';
import { RealTimeChart } from '@/components/real-time-chart';
import { useAuth } from '@/components/providers'; // ✅ FIXED: Changed from @/hooks/use-auth
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard automatically
    if (!loading && user) {
      router.push('/dashboard');
    } else if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Simple landing page or redirect
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">DataVue</h1>
        <p className="text-xl mb-8 text-muted-foreground">Visual Historian Dashboard</p>
        <div className="space-x-4">
          <Button onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => router.push('/login')}>
            Login
          </Button>
        </div>
      </div>
    </div>
  );
}
