import { createBrowserClient } from '@supabase/ssr'

let supabaseInstance: any = null

export function createClient() {
  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    console.error(
      'Missing Supabase environment variables. ' +
      'NEXT_PUBLIC_SUPABASE_URL:', url ? '✓' : '✗', 
      'NEXT_PUBLIC_SUPABASE_ANON_KEY:', anon ? '✓' : '✗'
    )
    // Return a dummy client that won't break the app
    return createBrowserClient('https://dummy.supabase.co', 'dummy-key')
  }

  supabaseInstance = createBrowserClient(url, anon)
  return supabaseInstance
}
