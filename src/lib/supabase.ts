import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'

import { clientEnv } from '../env/schema.mjs'
import { serverEnv } from '../env/schema.mjs'

// Client-side Supabase client
export const supabase = createClient(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Server-side Supabase client with service role key (bypasses RLS)
export const supabaseAdmin = createClient(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  serverEnv.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Server-side Supabase client for API routes (only for app directory)
// This function should only be used in Server Components (app directory)
export const createServerSupabaseClient = () => {
  // This function requires next/headers which is only available in app directory
  // For pages directory, use the regular supabase client or implement differently
  throw new Error('createServerSupabaseClient is only available in app directory. Use the regular supabase client instead.')
}

// Middleware helper for Supabase
export const createMiddlewareSupabaseClient = (req: NextRequest) => {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  return { supabase, response }
}
