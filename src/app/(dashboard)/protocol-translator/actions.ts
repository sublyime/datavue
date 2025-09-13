'use server';

import {
  translateObscureProtocol,
  TranslateObscureProtocolInput,
  TranslateObscureProtocolOutput,
} from '@/ai/flows/translate-obscure-protocol';

export async function getTranslation(
  input: TranslateObscureProtocolInput
): Promise<TranslateObscureProtocolOutput> {
  const translation = await translateObscureProtocol(input);
  return translation;
}
