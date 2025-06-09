import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export const createClient = (): SupabaseClient<Database> | null => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your_')) {
    // Return null for demo mode
    return null
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}