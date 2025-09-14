import { initializeApp } from '@/lib/startup';

// This runs on server startup
initializeApp().catch(console.error);

// Export an empty component
export default function InitServer() {
  return null;
}