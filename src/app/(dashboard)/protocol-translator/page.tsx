'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Terminal,
} from 'lucide-react';

import {
  TranslateObscureProtocolInput,
  TranslateObscureProtocolOutput,
} from '@/ai/flows/translate-obscure-protocol';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getTranslation } from './actions';

const formSchema = z.object({
  protocolData: z
    .string()
    .min(1, 'Please provide some data to translate.'),
  protocolDescription: z.string().optional(),
});

export default function ProtocolTranslatorPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TranslateObscureProtocolOutput | null>(
    null
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      protocolData: '',
      protocolDescription: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    const translation = await getTranslation(
      values as TranslateObscureProtocolInput
    );
    setResult(translation);
    setLoading(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>AI-Powered Protocol Translator</CardTitle>
          <CardDescription>
            Translate obscure or undocumented protocols into a common format.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="protocolData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protocol Data</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your raw protocol data here..."
                        className="min-h-[200px] font-code"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Raw data from the source (e.g., hex, binary string).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="protocolDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protocol Description (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 16-bit little-endian values"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Any known details about the protocol to aid translation.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="animate-spin" />}
                {loading ? 'Translating...' : 'Translate Data'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Translation Result</CardTitle>
          <CardDescription>
            The translated data and log will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Attempting to reverse-engineer protocol...
              </p>
            </div>
          )}
          {!loading && !result && (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 text-center">
              <Terminal className="h-16 w-16 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                Submit data to begin translation.
              </p>
            </div>
          )}
          {result && (
            <div className="space-y-4">
              <Alert
                variant={result.translationSuccessful ? 'default' : 'destructive'}
              >
                {result.translationSuccessful ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>
                  {result.translationSuccessful
                    ? 'Translation Successful'
                    : 'Translation Failed'}
                </AlertTitle>
                <AlertDescription>{result.logMessage}</AlertDescription>
              </Alert>

              {result.translationSuccessful && result.translatedData && (
                <div>
                  <h3 className="mb-2 font-semibold">Translated Data</h3>
                  <pre className="max-h-[400px] overflow-auto whitespace-pre-wrap rounded-md bg-muted p-4 font-code text-sm text-foreground">
                    {result.translatedData}
                  </pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
