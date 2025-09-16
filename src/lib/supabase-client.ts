// src/lib/supabase-client.ts (REPLACE existing file)
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// For client components (recommended approach)
export function createSupabaseClient() {
  return createClientComponentClient()
}

// For server components
export function createSupabaseServerClient() {
  return createServerComponentClient({ cookies })
}

// Legacy client (for backwards compatibility)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Default export for easier imports
export default createSupabaseClient