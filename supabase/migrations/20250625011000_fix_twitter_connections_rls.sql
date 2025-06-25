
-- Fix RLS policies for twitter_connections to allow service role access during OAuth callback
DROP POLICY IF EXISTS "Users can view their own Twitter connections" ON public.twitter_connections;
DROP POLICY IF EXISTS "Users can create their own Twitter connections" ON public.twitter_connections;
DROP POLICY IF EXISTS "Users can update their own Twitter connections" ON public.twitter_connections;
DROP POLICY IF EXISTS "Users can delete their own Twitter connections" ON public.twitter_connections;

-- Create policy that allows the service role to manage connections (needed for OAuth callback)
CREATE POLICY "Service role can manage Twitter connections" 
  ON public.twitter_connections 
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Also allow users to manage their own connections when authenticated
CREATE POLICY "Users can manage their own Twitter connections" 
  ON public.twitter_connections 
  FOR ALL 
  USING (auth.uid() = user_id OR auth.role() = 'service_role');
