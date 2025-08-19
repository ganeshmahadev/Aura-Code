/**
 * SESSION MANAGEMENT - Database Operations for Project Persistence
 * 
 * This module handles all database operations related to user sessions (projects).
 * Each session represents a unique development project with its own:
 * 
 * 1. Metadata (title, description, timestamps)
 * 2. Sandbox environment (sandbox_id, iframe_url)
 * 3. Chat history (linked chat_messages table)
 * 4. User ownership (user_id for access control)
 * 
 * DATABASE SCHEMA:
 * sessions table:
 * - id: UUID (primary key)
 * - user_id: UUID (foreign key to auth.users)
 * - title: TEXT (project name)
 * - description: TEXT (project description)
 * - sandbox_id: TEXT (Beam Cloud sandbox identifier)
 * - iframe_url: TEXT (live preview URL)
 * - is_active: BOOLEAN (session status)
 * - created_at, updated_at: TIMESTAMP
 * 
 * chat_messages table:
 * - id: UUID (primary key)
 * - session_id: UUID (foreign key to sessions)
 * - type: TEXT (message type: USER, ASSISTANT, INIT, etc.)
 * - content: TEXT (message content)
 * - sender: TEXT (USER or ASSISTANT)
 * - timestamp: TIMESTAMP (message timestamp)
 * - message_data: JSONB (additional message metadata)
 */

import { supabase, type Session, type ChatMessage } from './supabase'

/**
 * Creates a new development session/project for the user
 * Includes duplicate prevention to avoid creating multiple sessions with same title
 */
export const createSession = async (title: string, description?: string) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError) {
    throw userError
  }
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Check for recent sessions with the same title to prevent duplicates
  const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString()
  const { data: existingSessions } = await supabase
    .from('sessions')
    .select('id, title, created_at')
    .eq('user_id', user.id)
    .eq('title', title)
    .gte('created_at', fiveSecondsAgo)
    .limit(1)

  if (existingSessions && existingSessions.length > 0) {
    console.log('Preventing duplicate session creation for title:', title)
    return existingSessions[0] as Session
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

export const removeDuplicateSessions = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get all sessions grouped by title
  const { data: allSessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  if (!allSessions) return

  // Group sessions by title
  const sessionGroups: { [title: string]: Session[] } = {}
  allSessions.forEach(session => {
    if (!sessionGroups[session.title]) {
      sessionGroups[session.title] = []
    }
    sessionGroups[session.title].push(session)
  })

  // Find and delete duplicates (keep the first one created)
  const sessionsToDelete: string[] = []
  Object.values(sessionGroups).forEach(sessions => {
    if (sessions.length > 1) {
      // Keep the first one, delete the rest
      sessions.slice(1).forEach(session => {
        sessionsToDelete.push(session.id)
      })
    }
  })

  if (sessionsToDelete.length > 0) {
    console.log(`Removing ${sessionsToDelete.length} duplicate sessions`)
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .in('id', sessionsToDelete)

    if (deleteError) {
      throw deleteError
    }

    console.log(`Successfully removed ${sessionsToDelete.length} duplicate sessions`)
  }

  return sessionsToDelete.length
}

// Chat message functions
export const saveMessage = async (
  sessionId: string,
  message: {
    id?: string
    type: string
    content: string
    sender: string
    timestamp: number
    data?: Record<string, any>
  }
) => {
  try {
    // Check if message already exists to prevent duplicates
    const { data: existingMessages } = await supabase
      .from('chat_messages')
      .select('id')
      .eq('session_id', sessionId)
      .eq('type', message.type)
      .eq('content', message.content)
      .eq('sender', message.sender)
      .gte('timestamp', new Date(message.timestamp - 5000).toISOString()) // Within 5 seconds
      .lte('timestamp', new Date(message.timestamp + 5000).toISOString())
      .limit(1);

    if (existingMessages && existingMessages.length > 0) {
      console.log('Message already exists, skipping save');
      return existingMessages[0] as ChatMessage;
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        type: message.type,
        content: message.content,
        sender: message.sender,
        timestamp: new Date(message.timestamp).toISOString(),
        message_data: message.data || {}
      })
      .select()
      .single()

    if (error) {
      // Gracefully handle table not existing yet
      if (error.code === 'PGRST205') {
        console.warn('Chat messages table not created yet. Please create it using the provided SQL.');
        return null;
      }
      // Handle duplicate key error gracefully
      if (error.code === '23505') {
        console.log('Message already exists (duplicate key), skipping save');
        return null;
      }
      console.error('Error saving message:', error)
      return null
    }

    return data as ChatMessage
  } catch (error) {
    console.warn('Message saving temporarily disabled until chat_messages table is created');
    return null;
  }
}

export const getSessionMessages = async (sessionId: string) => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })

    if (error) {
      // Gracefully handle table not existing yet
      if (error.code === 'PGRST205') {
        console.warn('Chat messages table not created yet. Returning empty messages.');
        return [];
      }
      console.error('Error loading messages:', error)
      return []
    }

    return data as ChatMessage[]
  } catch (error) {
    console.warn('Message loading temporarily disabled until chat_messages table is created');
    return [];
  }
}