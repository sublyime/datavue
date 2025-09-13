'use server';

/**
 * @fileOverview Provides database configuration suggestions based on data characteristics.
 *
 * - suggestDatabaseConfig - A function that returns database configuration suggestions.
 * - SuggestDatabaseConfigInput - The input type for the suggestDatabaseConfig function.
 * - SuggestDatabaseConfigOutput - The return type for the suggestDatabaseConfig function.
 */

import { definePrompt, defineFlow } from '@/ai/genkit';
import { z } from 'zod';

const SuggestDatabaseConfigInputSchema = z.object({
  dataVolume: z
    .string()
    .describe(
      'The estimated volume of data to be stored (e.g., "100 GB", "1 TB per month").'
    ),
  dataVelocity: z
    .string()
    .describe(
      'The rate at which data is ingested (e.g., "1000 records per second", "batch updates daily").'
    ),
  intendedAnalysis: z
    .string()
    .describe(
      'A description of the types of analysis to be performed on the data (e.g., "real-time dashboards", "ad-hoc queries", "complex statistical analysis").'
    ),
});
export type SuggestDatabaseConfigInput = z.infer<
  typeof SuggestDatabaseConfigInputSchema
>;

const SuggestDatabaseConfigOutputSchema = z.object({
  suggestedDatabaseType: z.string().describe('The suggested type of database (e.g., "PostgreSQL", "MongoDB", "TimescaleDB").'),
  suggestedSettings: z
    .string()
    .describe(
      'Recommended settings and configurations for the database, tailored to the input data characteristics.'
    ),
  justification: z
    .string()
    .describe(
      'A justification for the suggested database type and settings, explaining why they are appropriate for the given data volume, velocity, and intended analysis.'
    ),
});
export type SuggestDatabaseConfigOutput = z.infer<
  typeof SuggestDatabaseConfigOutputSchema
>;

export async function suggestDatabaseConfig(
  input: SuggestDatabaseConfigInput
): Promise<SuggestDatabaseConfigOutput> {
  return suggestDatabaseConfigFlow(input);
}

const prompt = definePrompt({
  name: 'suggestDatabaseConfigPrompt',
  input: {schema: SuggestDatabaseConfigInputSchema},
  output: {schema: SuggestDatabaseConfigOutputSchema},
  prompt: `You are an expert database architect. Based on the provided data volume, velocity, and intended analysis, you will suggest an optimal database configuration.

Data Volume: {{dataVolume}}
Data Velocity: {{dataVelocity}}
Intended Analysis: {{intendedAnalysis}}

You must respond with EXACTLY this JSON structure (no additional text, no markdown):

{
  "suggestedDatabaseType": "Database name (e.g. PostgreSQL, MongoDB, etc.)",
  "suggestedSettings": "Configuration recommendations as a single text string",
  "justification": "Explanation of why these choices are appropriate"
}

Example response:
{
  "suggestedDatabaseType": "PostgreSQL",
  "suggestedSettings": "Use connection pooling with max 100 connections, enable query optimization, set shared_buffers to 25% of RAM, configure appropriate indexes for time-series queries",
  "justification": "PostgreSQL is ideal for this use case because it handles structured data well with ACID compliance, supports efficient indexing for analytical queries, and has excellent performance for the specified data volume and velocity."
}`,
});

const suggestDatabaseConfigFlow = defineFlow(
  {
    name: 'suggestDatabaseConfigFlow',
    inputSchema: SuggestDatabaseConfigInputSchema,
    outputSchema: SuggestDatabaseConfigOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output;
  }
);

// Export the flow so it gets registered with Genkit
export { suggestDatabaseConfigFlow };