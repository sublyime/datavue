import { DataSourceManager } from './data-sources/manager';
import { testConnection } from './db';

export async function initializeApp() {
  console.log('🚀 Starting application initialization...');

  try {
    // Test database connection
    console.log('📊 Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    console.log('✅ Database connection successful');

    // Initialize data source manager
    console.log('🔌 Initializing data source manager...');
    const dataSourceManager = DataSourceManager.getInstance();
    await dataSourceManager.initialize();
    console.log('✅ Data source manager initialized');

    console.log('🎉 Application initialization complete');

  } catch (error) {
    console.error('❌ Application initialization failed:', error);
    throw error;
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  try {
    const dataSourceManager = DataSourceManager.getInstance();
    await dataSourceManager.shutdown();
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  try {
    const dataSourceManager = DataSourceManager.getInstance();
    await dataSourceManager.shutdown();
    console.log('✅ Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});
