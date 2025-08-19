-- Create chat_messages table for storing session conversation history
-- This table links to sessions and stores both user and AI messages

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    type TEXT NOT NULL,       -- MessageType enum value (USER, ASSISTANT, AGENT_PARTIAL, etc.)
    content TEXT NOT NULL,    -- Message text content
    sender TEXT NOT NULL,     -- USER or ASSISTANT
    timestamp TIMESTAMPTZ NOT NULL,
    message_data JSONB DEFAULT '{}', -- Additional message metadata (files, urls, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON public.chat_messages(timestamp);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to ensure users can only access their own chat messages
-- Drop existing policy first if it exists
DROP POLICY IF EXISTS "Users can only access their own chat messages" ON public.chat_messages;

CREATE POLICY "Users can only access their own chat messages" ON public.chat_messages
FOR ALL USING (
    session_id IN (
        SELECT id FROM public.sessions WHERE user_id = auth.uid()
    )
);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT USAGE ON SEQUENCE chat_messages_id_seq TO authenticated;