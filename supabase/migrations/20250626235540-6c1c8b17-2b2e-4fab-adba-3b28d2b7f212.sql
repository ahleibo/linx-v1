
-- Add a public bio field and make some profile data discoverable
ALTER TABLE public.profiles 
ADD COLUMN bio TEXT,
ADD COLUMN is_public BOOLEAN DEFAULT true,
ADD COLUMN avatar_url TEXT,
ADD COLUMN username TEXT UNIQUE;

-- Create an index for faster username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Create RLS policies for social discovery
-- Allow users to view public profiles
CREATE POLICY "Users can view public profiles" 
  ON public.profiles 
  FOR SELECT 
  USING (is_public = true OR auth.uid() = id);

-- Create a view for public profile discovery (excluding sensitive data)
CREATE OR REPLACE VIEW public.public_profiles AS 
SELECT 
  id,
  full_name,
  username,
  bio,
  avatar_url,
  created_at
FROM public.profiles 
WHERE is_public = true;

-- Enable RLS on the view
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Create a function to get user stats for social profiles
CREATE OR REPLACE FUNCTION get_user_public_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_posts', COUNT(p.id),
    'total_collections', (
      SELECT COUNT(DISTINCT c.id) 
      FROM collections c 
      WHERE c.user_id = user_uuid
    ),
    'member_since', (
      SELECT DATE_PART('year', created_at) 
      FROM profiles 
      WHERE id = user_uuid
    )
  ) INTO result
  FROM posts p
  WHERE p.user_id = user_uuid;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
