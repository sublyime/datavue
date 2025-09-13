import { config } from 'dotenv';
config();

// Import our custom genkit setup
import { ai, ollama } from '@/ai/genkit';

// Import the flows
import '@/ai/flows/suggest-database-config';
import '@/ai/flows/translate-obscure-protocol';

// Test connection to Ollama on startup
async function testOllamaConnection() {
  try {
    const models = await ollama.listModels();
    console.log('✅ Ollama connected successfully!');
    console.log('📋 Available models:', models.map(m => m.name).join(', '));
  } catch (error) {
    console.error('❌ Failed to connect to Ollama:', error);
    console.log('💡 Make sure Ollama is running on http://127.0.0.1:11434');
  }
}

// Test the connection when the module loads
testOllamaConnection();

console.log('🚀 Custom Ollama-powered Genkit setup loaded!');