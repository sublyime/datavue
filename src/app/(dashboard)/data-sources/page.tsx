'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

// TODO: Define a proper type for the data source
interface DataSource {
  id: string;
  name: string;
  description: string;
  // Add other properties as needed
}

export default function DataSourcesPage() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);

  useEffect(() => {
    async function loadDataSources() {
      try {
        const response = await apiClient.getDataSources();
        setDataSources(response || []);
      } catch (error) {
        console.error("Failed to load data sources", error);
        // Handle error (e.g., show a toast message)
      }
    }
    loadDataSources();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Data Sources</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dataSources.map((source) => (
          <div key={source.id} className="border p-4 rounded-lg">
            <h2 className="text-xl font-semibold">{source.name}</h2>
            <p>{source.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
