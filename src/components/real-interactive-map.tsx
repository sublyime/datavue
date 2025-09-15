'use client';

import { useCallback } from 'react';
import { MapPin, Wifi, WifiOff, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

interface RealInteractiveMapProps {
  dataSources?: DataSource[];
  onMarkerClick?: (dataSource: DataSource) => void;
  onMapClick?: (lat: number, lng: number) => void;
  selectedMarkerId?: number;
  showAddMarker?: boolean;
  className?: string;
}

export function RealInteractiveMap({ 
  dataSources = [],
  onMarkerClick = () => {},
  onMapClick = () => {},
  selectedMarkerId,
  showAddMarker = false,
  className 
}: RealInteractiveMapProps) {

  const coordinateToScreen = useCallback((lat: number, lng: number, width: number, height: number) => {
    const x = ((lng + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return { x, y };
  }, []);

  const handleMapClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const lng = (x / rect.width) * 360 - 180;
    const lat = 90 - (y / rect.height) * 180;
    
    onMapClick(lat, lng);
  }, [onMapClick]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Wifi className="h-4 w-4 text-white" />;
      case 'connecting': return <Activity className="h-4 w-4 text-white animate-pulse" />;
      case 'error': return <WifiOff className="h-4 w-4 text-white" />;
      default: return <WifiOff className="h-4 w-4 text-white" />;
    }
  };

  return (
    <div className={cn("relative w-full h-full", className)}>
      <div 
        className="w-full h-full bg-muted rounded-lg cursor-crosshair relative overflow-hidden"
        onClick={handleMapClick}
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(34, 197, 94, 0.1) 0%, transparent 40%),
            radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 40%),
            radial-gradient(circle at 60% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 40%)
          `,
          backgroundSize: 'cover'
        }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {showAddMarker && (
          <div className="absolute top-4 left-4 bg-background/80 backdrop-blur rounded-lg p-3 text-sm shadow-md">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">Click anywhere to add a data source</span>
            </div>
          </div>
        )}

        {dataSources
          .filter(source => source.latitude !== undefined && source.longitude !== undefined)
          .map((source) => {
            // Use a fixed size for consistent positioning, could be dynamic based on container
            const containerRect = { width: 800, height: 600 };
            const position = coordinateToScreen(
              source.latitude!,
              source.longitude!,
              containerRect.width,
              containerRect.height
            );

            return (
              <div
                key={source.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{
                  left: `${(position.x / containerRect.width) * 100}%`,
                  top: `${(position.y / containerRect.height) * 100}%`,
                  zIndex: selectedMarkerId === source.id ? 10 : 1
                }}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent map click event
                  onMarkerClick(source);
                }}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-lg",
                  selectedMarkerId === source.id ? 'border-primary scale-125' : 'border-card',
                  source.isActive 
                    ? source.connectionStatus === 'connected' 
                      ? "bg-green-500 hover:bg-green-600"
                      : source.connectionStatus === 'error'
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-gray-400 hover:bg-gray-500"
                )}>
                  {getStatusIcon(source.connectionStatus)}
                </div>

                {/* Show label for selected marker */}
                {(selectedMarkerId === source.id) && (
                   <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
                      <div className="bg-background/90 text-foreground text-xs font-semibold px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                        {source.name}
                      </div>
                   </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default RealInteractiveMap;
