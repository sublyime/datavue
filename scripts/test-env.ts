// scripts/test-env.ts
import { config } from 'dotenv';
import { resolve } from 'path';

console.log('Testing .env loading...');

const envPath = resolve(process.cwd(), '.env');
console.log('Looking for .env at:', envPath);

const result = config({ path: envPath });
if (result.error) {
  console.error('Error loading .env:', result.error);
} else {
  console.log('✅ .env loaded successfully');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('NODE_ENV:', process.env.NODE_ENV);
}