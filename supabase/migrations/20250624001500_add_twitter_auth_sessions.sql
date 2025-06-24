
-- Create table for storing temporary Twitter OAuth sessions
CREATE TABLE public.twitter_auth_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state TEXT NOT NULL UNIQUE,
  code_verifier TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.twitter_auth_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy that allows the service role to manage sessions
CREATE POLICY "Service role can manage Twitter auth sessions" 
  ON public.twitter_auth_sessions 
  FOR ALL 
  USING (true);

-- Create index for efficient lookups
CREATE INDEX idx_twitter_auth_sessions_state ON public.twitter_auth_sessions(state);
CREATE INDEX idx_twitter_auth_sessions_user_id ON public.twitter_auth_sessions(user_id);

-- Add cleanup function to remove old sessions (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_twitter_auth_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.twitter_auth_sessions 
  WHERE created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
