import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// Load environment variables - support multiple env files
config({ path: '.env.local' }); // Next.js local development
config({ path: '.env' }); // Fallback to .env

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  
  // Use connection string if available, otherwise fall back to individual credentials
  dbCredentials: process.env.DATABASE_URL 
    ? {
        url: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' ? 'require' : false,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'ala1nna',
        database: process.env.DB_NAME || 'visual_historian',
        ssl: process.env.DB_SSL === 'true' ? 'require' : false,
      },
  
  verbose: true,
  strict: true,
  
  // Additional useful options
  introspect: {
    casing: 'camel'
  },
  
  // Migration configuration
  migrations: {
    prefix: 'supabase' // or 'timestamp' for timestamp-based naming
  }
});
