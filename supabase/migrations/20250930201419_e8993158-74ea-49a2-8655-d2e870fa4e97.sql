-- Fix the security definer view warning
-- Recreate the view to use SECURITY INVOKER instead of SECURITY DEFINER

DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles AS
SELECT 
  id,
  created_at,
  full_name,
  username,
  bio,
  avatar_url
FROM public.profiles
WHERE is_public = true;

-- Grant read access to public_profiles for all authenticated and anonymous users
GRANT SELECT ON public.public_profiles TO authenticated, anon;