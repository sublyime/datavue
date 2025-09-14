// scripts/debug-env.ts
console.log('=== Environment Debug ===');
console.log('Process environment:');
console.log('USER:', process.env.USER);
console.log('USERNAME:', process.env.USERNAME);
console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Load .env file manually
import { config } from 'dotenv';
import { resolve } from 'path';

console.log('\n=== Loading .env file ===');
const envPath = resolve(process.cwd(), '.env');
console.log('Looking for .env at:', envPath);

const result = config({ path: envPath });
if (result.error) {
  console.log('Error loading .env:', result.error);
} else {
  console.log('.env loaded successfully');
  console.log('DATABASE_URL after loading .env:', process.env.DATABASE_URL);
}

// Parse the DATABASE_URL to see what user it contains
if (process.env.DATABASE_URL) {
  try {
    const url = new URL(process.env.DATABASE_URL);
    console.log('\n=== Parsed DATABASE_URL ===');
    console.log('Username:', url.username);
    console.log('Host:', url.hostname);
    console.log('Database:', url.pathname.replace('/', ''));
  } catch (error) {
    console.log('Error parsing DATABASE_URL:', error);
  }
}