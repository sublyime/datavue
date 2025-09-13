'use client';

import Image from 'next/image';
import { MapPin } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

const mapPoints = [
  { id: 'houston', name: 'Houston Plant', value: '45.7 C', top: '55%', left: '20%' },
  { id: 'rotterdam', name: 'Rotterdam Terminal', value: '1.2k MQTT/s', top: '35%', left: '48%' },
  { id: 'singapore', name: 'Singapore Refinery', value: '89% Capacity', top: '70%', left: '75%' },
  { id: 'dubai', name: 'Dubai Ops', value: 'Normal', top: '58%', left: '60%' },
];

export function MapPlaceholder() {
  const mapImage = PlaceHolderImages.find((img) => img.id === 'world-map');

  if (!mapImage) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-lg border-2 border-dashed bg-muted">
        <p className="text-muted-foreground">Map data not available</p>
      </div>
    );
  }
  
  return (
    <TooltipProvider>
      <div className="relative h-full min-h-[400px] w-full overflow-hidden rounded-lg border">
        <Image
          src={mapImage.imageUrl}
          alt={mapImage.description}
          fill
          className="object-cover"
          data-ai-hint={mapImage.imageHint}
        />
        <div className="absolute inset-0 bg-background/20" />
        
        {mapPoints.map((point) => (
          <Tooltip key={point.id}>
            <TooltipTrigger asChild>
              <button
                className="absolute -translate-x-1/2 -translate-y-1/2 transform transition-transform hover:scale-125 focus:outline-none"
                style={{ top: point.top, left: point.left }}
                aria-label={`Data for ${point.name}`}
              >
                <MapPin className="h-6 w-6 fill-primary text-primary-foreground drop-shadow-lg" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-bold">{point.name}</p>
              <p>Value: {point.value}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
