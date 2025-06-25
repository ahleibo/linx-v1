
-- Drop existing tables to start fresh
DROP TABLE IF EXISTS public.twitter_connections CASCADE;
DROP TABLE IF EXISTS public.twitter_auth_sessions CASCADE;

-- Create a simple twitter connections table
CREATE TABLE public.twitter_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  twitter_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.twitter_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own Twitter connections" 
  ON public.twitter_connections 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create unique index
CREATE UNIQUE INDEX idx_twitter_connections_user_unique ON public.twitter_connections(user_id);
