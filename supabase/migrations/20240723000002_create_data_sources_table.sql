-- supabase/migrations/20240723000002_create_data_sources_table.sql

CREATE TABLE IF NOT EXISTS "public"."data_sources" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT now(),
    "name" TEXT,
    "lastValue" TEXT,
    "lastUpdated" TIMESTAMP WITH TIME ZONE,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "user_id" UUID DEFAULT auth.uid(),

    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Enable Row-Level Security
ALTER TABLE "public"."data_sources" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own data sources
CREATE POLICY "Allow authenticated users to read their own data sources" 
ON "public"."data_sources" 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Allow authenticated users to create data sources
CREATE POLICY "Allow authenticated users to create data sources" 
ON "public"."data_sources" 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);
