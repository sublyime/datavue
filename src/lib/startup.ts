import { DataSourceManager } from './data-sources/manager';

export async function initializeApp() {
  console.log('Starting application initialization...');
  
  // Initialize data source manager
  const dataSourceManager = DataSourceManager.getInstance();
  await dataSourceManager.initialize();

  console.log('Application initialization complete');
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  const dataSourceManager = DataSourceManager.getInstance();
  await dataSourceManager.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  const dataSourceManager = DataSourceManager.getInstance();
  await dataSourceManager.shutdown();
  process.exit(0);
});