'use server';

import {
  suggestDatabaseConfig,
  SuggestDatabaseConfigInput,
  SuggestDatabaseConfigOutput,
} from '@/ai/flows/suggest-database-config';

export async function getSuggestion(
  input: SuggestDatabaseConfigInput
): Promise<SuggestDatabaseConfigOutput> {
  const suggestion = await suggestDatabaseConfig(input);
  return suggestion;
}
