
-- Fix RLS policies for twitter_auth_sessions to allow service role access during OAuth callback
DROP POLICY IF EXISTS "Users can manage their own auth sessions" ON public.twitter_auth_sessions;

-- Create policy that allows the service role to manage sessions (needed for OAuth callback)
CREATE POLICY "Service role can manage Twitter auth sessions" 
  ON public.twitter_auth_sessions 
  FOR ALL 
  USING (true);

-- Also allow users to manage their own sessions when authenticated
CREATE POLICY "Users can manage their own auth sessions" 
  ON public.twitter_auth_sessions 
  FOR ALL 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');
