-- Fix email exposure by removing public read access to profiles table
-- The public_profiles view already exists without sensitive data and should be used for public access

-- Drop the problematic policy that exposes emails
DROP POLICY IF EXISTS "Users can view public profiles" ON public.profiles;

-- The "Users can view own profile" policy remains, which only allows users to see their own data
-- This ensures users can only access their own email and other profile data

-- Recreate public_profiles view to ensure it excludes sensitive fields
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles 
WITH (security_barrier = true)
AS
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