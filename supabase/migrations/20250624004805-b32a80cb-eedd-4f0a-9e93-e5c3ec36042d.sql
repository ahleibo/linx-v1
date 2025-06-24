
-- Create twitter_auth_sessions table for storing PKCE code verifiers
CREATE TABLE public.twitter_auth_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  state text NOT NULL UNIQUE,
  code_verifier text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.twitter_auth_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own auth sessions
CREATE POLICY "Users can manage their own auth sessions" 
  ON public.twitter_auth_sessions 
  FOR ALL 
  USING (user_id = auth.uid());

-- Add index for faster lookups by state
CREATE INDEX idx_twitter_auth_sessions_state ON public.twitter_auth_sessions(state);

-- Add cleanup trigger to remove old sessions (older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_expired_twitter_auth_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.twitter_auth_sessions 
  WHERE created_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired sessions every hour
-- Note: This requires the pg_cron extension, but we'll handle cleanup in the application code instead
