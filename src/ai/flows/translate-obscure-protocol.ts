'use server';

/**
 * @fileOverview Translates obscure industrial protocols to standard formats.
 */

import { definePrompt, defineFlow } from '@/ai/genkit';
import { z } from 'zod';

const TranslateObscureProtocolInputSchema = z.object({
  protocolData: z
    .string()
    .describe('The raw protocol data or message that needs to be translated.'),
  protocolType: z
    .string()
    .describe('The type or name of the obscure protocol (e.g., "Modbus RTU", "DNP3", "Custom Legacy Protocol").'),
  targetFormat: z
    .string()
    .optional()
    .describe('The desired output format (e.g., "JSON", "XML", "CSV"). Defaults to JSON if not specified.'),
});
export type TranslateObscureProtocolInput = z.infer<
  typeof TranslateObscureProtocolInputSchema
>;

const TranslateObscureProtocolOutputSchema = z.object({
  translatedData: z
    .string()
    .describe('The translated data in the requested format.'),
  dataFields: z
    .array(z.string())
    .describe('List of identified data fields in the protocol.'),
  explanation: z
    .string()
    .describe('Explanation of the protocol structure and translation process.'),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe('Confidence level of the translation accuracy (0-100).'),
});
export type TranslateObscureProtocolOutput = z.infer<
  typeof TranslateObscureProtocolOutputSchema
>;

export async function translateObscureProtocol(
  input: TranslateObscureProtocolInput
): Promise<TranslateObscureProtocolOutput> {
  return translateObscureProtocolFlow(input);
}

const prompt = definePrompt({
  name: 'translateObscureProtocolPrompt',
  input: { schema: TranslateObscureProtocolInputSchema },
  output: { schema: TranslateObscureProtocolOutputSchema },
  prompt: `You are an expert in industrial communication protocols and data translation. Your task is to analyze and translate obscure protocol data into a standard format.

Protocol Data: {{protocolData}}
Protocol Type: {{protocolType}}
Target Format: {{targetFormat}}

Please analyze the protocol data and provide a translation. Consider common industrial protocols like Modbus, DNP3, BACnet, and custom legacy protocols.

Respond with a JSON object containing exactly these fields:
{
  "translatedData": "The data translated to the target format (default JSON if not specified)",
  "dataFields": ["array", "of", "identified", "field", "names"],
  "explanation": "Detailed explanation of the protocol structure and how the translation was performed",
  "confidence": 85
}

Only return the JSON object, no additional text or markdown formatting.`,
});

const translateObscureProtocolFlow = defineFlow(
  {
    name: 'translateObscureProtocolFlow',
    inputSchema: TranslateObscureProtocolInputSchema,
    outputSchema: TranslateObscureProtocolOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output;
  }
);