// src/ai/dev.ts
import { config } from 'dotenv';
config();

// Import our custom genkit setup - use relative import
import { ai, customOllama } from './genkit';

// Import the flows
import './flows/suggest-database-config';
import './flows/translate-obscure-protocol';

// Test connection to Ollama on startup
async function testOllamaConnection() {
  try {
    const models = await customOllama.listModels();
    console.log('✅ Ollama connected successfully!');
    console.log('📋 Available models:', models.map(m => m.name).join(', '));
    
    // Test a simple prompt to verify the model works
    const testResponse = await customOllama.generate('Hello, how are you?');
    console.log('🤖 Test response:', testResponse.substring(0, 100) + '...');
  } catch (error) {
    console.error('❌ Failed to connect to Ollama:', error);
    console.log('💡 Make sure Ollama is running on http://127.0.0.1:11434');
  }
}

// Test the connection when the module loads
testOllamaConnection();

console.log('🚀 Custom Ollama-powered Genkit setup loaded!');