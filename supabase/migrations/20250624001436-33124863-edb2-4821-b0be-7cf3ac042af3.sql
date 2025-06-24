
-- Create table for storing Twitter OAuth connections
CREATE TABLE public.twitter_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.twitter_connections ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own connections
CREATE POLICY "Users can view their own Twitter connections" 
  ON public.twitter_connections 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to insert their own connections
CREATE POLICY "Users can create their own Twitter connections" 
  ON public.twitter_connections 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update their own connections
CREATE POLICY "Users can update their own Twitter connections" 
  ON public.twitter_connections 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to delete their own connections
CREATE POLICY "Users can delete their own Twitter connections" 
  ON public.twitter_connections 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index for efficient lookups
CREATE INDEX idx_twitter_connections_user_id ON public.twitter_connections(user_id);
CREATE UNIQUE INDEX idx_twitter_connections_user_unique ON public.twitter_connections(user_id);
