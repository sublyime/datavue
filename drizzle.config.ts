// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:ala1nna@localhost:5432/visual_historian',
  },
  verbose: true,
  strict: true,
} satisfies Config;