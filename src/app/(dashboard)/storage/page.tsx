'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Database, Settings, Lightbulb } from 'lucide-react';

import {
  SuggestDatabaseConfigInput,
  SuggestDatabaseConfigOutput,
} from '@/ai/flows/suggest-database-config';
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
import { getSuggestion } from './actions';

const formSchema = z.object({
  dataVolume: z
    .string()
    .min(1, 'Please estimate the data volume.'),
  dataVelocity: z
    .string()
    .min(1, 'Please estimate the data velocity.'),
  intendedAnalysis: z
    .string()
    .min(10, 'Please describe your analysis needs.'),
});

export default function StoragePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SuggestDatabaseConfigOutput | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataVolume: '',
      dataVelocity: '',
      intendedAnalysis: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    const suggestion = await getSuggestion(values as SuggestDatabaseConfigInput);
    setResult(suggestion);
    setLoading(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>AI-Powered Storage Configuration</CardTitle>
            <CardDescription>
              Describe your data, and we'll suggest the best storage solution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="dataVolume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Volume</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g., "1 TB per day"'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Estimated volume of data to be stored.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataVelocity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Velocity</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='e.g., "10,000 records/sec"'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The rate at which data is ingested.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="intendedAnalysis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intended Analysis</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., Real-time dashboards, ad-hoc queries..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        How you plan to use or query the data.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="animate-spin" />}
                  {loading ? 'Analyzing...' : 'Get Suggestion'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-3">
        <Card className="h-full min-h-[500px]">
          <CardHeader>
            <CardTitle>Configuration Suggestion</CardTitle>
            <CardDescription>
              Our AI architect's recommendation will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">
                  Consulting with our database architects...
                </p>
              </div>
            )}
            {!loading && !result && (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 text-center">
                <Database className="h-16 w-16 text-muted-foreground/30" />
                <p className="text-muted-foreground">
                  Fill out the form to get your personalized suggestion.
                </p>
              </div>
            )}
            {result && (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Database className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>{result.suggestedDatabaseType}</CardTitle>
                      <CardDescription>Suggested Database</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                        <Settings className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <CardTitle>Recommended Settings</CardTitle>
                      <CardDescription className="pt-2 text-foreground">
                        <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 font-code text-sm">
                          {result.suggestedSettings}
                        </pre>
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
                 <Card>
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500/10">
                        <Lightbulb className="h-6 w-6 text-yellow-500" />
                    </div>
                    <div>
                      <CardTitle>Justification</CardTitle>
                      <CardDescription className="pt-2 text-foreground/90">{result.justification}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
