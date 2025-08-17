import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables!')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export type Session = {
  id: string
  user_id: string
  title: string
  description?: string
  sandbox_id?: string
  thumbnail?: string
  created_at: string
  updated_at: string
  iframe_url?: string
  is_active: boolean
}

export type Profile = {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}