import { genkit } from 'genkit';
import { z } from 'genkit';

// Custom Ollama client
class OllamaClient {
  private baseUrl: string;
  private defaultModel: string;

  constructor(baseUrl = 'http://127.0.0.1:11434', defaultModel = 'gemma3:4b') {
    this.baseUrl = baseUrl;
    this.defaultModel = defaultModel;
  }

  async generate(prompt: string, model?: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || this.defaultModel,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  }

  async chat(messages: Array<{role: string, content: string}>, model?: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || this.defaultModel,
        messages,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          top_k: 40,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    return data.message.content;
  }

  async listModels(): Promise<Array<{name: string, size: number, modified: string}>> {
    const response = await fetch(`${this.baseUrl}/api/tags`);
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} - ${response.statusText}`);
    }
    const data = await response.json();
    return data.models;
  }
}

// Initialize Genkit without plugins
export const ai = genkit({
  plugins: [],
});

// Export Ollama client instance
export const ollama = new OllamaClient();

// Helper function for structured generation
export async function generateStructured<T>(
  prompt: string,
  schema: z.ZodSchema<T>,
  model?: string
): Promise<T> {
  const enhancedPrompt = `${prompt}

Please respond with valid JSON that matches this structure. Only return the JSON object, no additional text or markdown formatting.`;

  const response = await ollama.generate(enhancedPrompt, model);
  
  try {
    // Clean up response - remove markdown formatting if present
    const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleanResponse);
    
    // Validate against schema
    return schema.parse(parsed);
  } catch (error) {
    console.error('Failed to parse or validate response:', error);
    console.error('Raw response:', response);
    throw new Error(`Failed to generate structured response: ${error}`);
  }
}

// Define prompt helper
export function definePrompt<TInput, TOutput>(config: {
  name: string;
  input: { schema: z.ZodSchema<TInput> };
  output: { schema: z.ZodSchema<TOutput> };
  prompt: string;
}) {
  return async (input: TInput): Promise<{ output: TOutput }> => {
    // Replace template variables in prompt
    let processedPrompt = config.prompt;
    
    // Simple template replacement for {{variable}} syntax
    Object.entries(input as Record<string, any>).forEach(([key, value]) => {
      processedPrompt = processedPrompt.replace(
        new RegExp(`{{${key}}}`, 'g'),
        String(value)
      );
    });

    const output = await generateStructured(
      processedPrompt,
      config.output.schema
    );

    return { output };
  };
}

// Define flow helper
export function defineFlow<TInput, TOutput>(
  config: {
    name: string;
    inputSchema: z.ZodSchema<TInput>;
    outputSchema: z.ZodSchema<TOutput>;
  },
  fn: (input: TInput) => Promise<TOutput>
) {
  return async (input: TInput): Promise<TOutput> => {
    // Validate input
    const validatedInput = config.inputSchema.parse(input);
    
    // Execute function
    const result = await fn(validatedInput);
    
    // Validate output
    return config.outputSchema.parse(result);
  };
}