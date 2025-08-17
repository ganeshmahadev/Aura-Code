import { supabase, type Session } from './supabase'

export const createSession = async (title: string, description?: string) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError) {
    throw userError
  }
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      title,
      description,
      is_active: true
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as Session
}

export const getUserSessions = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    throw error
  }

  return data as Session[]
}

export const updateSession = async (
  sessionId: string, 
  updates: Partial<Session>
) => {
  const { data, error } = await supabase
    .from('sessions')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as Session
}

export const deleteSession = async (sessionId: string) => {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)

  if (error) {
    throw error
  }

  return true
}

export const getSession = async (sessionId: string) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) {
    throw error
  }

  return data as Session
}