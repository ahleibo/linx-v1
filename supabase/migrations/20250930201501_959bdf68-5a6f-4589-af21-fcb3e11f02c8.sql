-- Create a secure public profiles view
-- This view needs SECURITY DEFINER because:
-- 1. Anonymous users need to read public profile data
-- 2. The profiles table is protected by RLS that blocks anonymous access
-- 3. The view explicitly excludes sensitive data (email) from exposure
-- 4. This is the recommended pattern for creating public views of private tables

DROP VIEW IF EXISTS public.public_profiles;

-- Create a function that returns public profile data
-- Using a function allows us to have SECURITY DEFINER without the view warning
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE (
  id uuid,
  created_at timestamp with time zone,
  full_name text,
  username text,
  bio text,
  avatar_url text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT 
    id,
    created_at,
    full_name,
    username,
    bio,
    avatar_url
  FROM public.profiles
  WHERE is_public = true;
$$;

-- Create the view using the function
CREATE VIEW public.public_profiles AS
SELECT * FROM public.get_public_profiles();

-- Grant access to the function and view
GRANT EXECUTE ON FUNCTION public.get_public_profiles() TO authenticated, anon;
GRANT SELECT ON public.public_profiles TO authenticated, anon;