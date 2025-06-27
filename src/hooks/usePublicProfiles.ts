
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PublicProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  stats?: {
    total_posts: number;
    total_collections: number;
    member_since: number;
  } | null;
}

export function usePublicProfiles() {
  return useQuery({
    queryKey: ['public-profiles'],
    queryFn: async (): Promise<PublicProfile[]> => {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch stats for each profile
      const profilesWithStats = await Promise.all(
        data.map(async (profile) => {
          try {
            const { data: statsData } = await supabase.rpc('get_user_public_stats', {
              user_uuid: profile.id
            });

            // Parse the JSON stats data and ensure it matches our expected structure
            const parsedStats = statsData && typeof statsData === 'object' ? {
              total_posts: Number(statsData.total_posts) || 0,
              total_collections: Number(statsData.total_collections) || 0,
              member_since: Number(statsData.member_since) || new Date().getFullYear()
            } : null;

            return {
              ...profile,
              stats: parsedStats
            };
          } catch (error) {
            console.error('Error fetching stats for profile:', profile.id, error);
            return {
              ...profile,
              stats: null
            };
          }
        })
      );

      return profilesWithStats;
    },
  });
}

export function usePublicProfile(userId: string) {
  return useQuery({
    queryKey: ['public-profile', userId],
    queryFn: async (): Promise<PublicProfile | null> => {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      try {
        const { data: statsData } = await supabase.rpc('get_user_public_stats', {
          user_uuid: userId
        });

        // Parse the JSON stats data and ensure it matches our expected structure
        const parsedStats = statsData && typeof statsData === 'object' ? {
          total_posts: Number(statsData.total_posts) || 0,
          total_collections: Number(statsData.total_collections) || 0,
          member_since: Number(statsData.member_since) || new Date().getFullYear()
        } : null;

        return {
          ...data,
          stats: parsedStats
        };
      } catch (error) {
        console.error('Error fetching stats for profile:', userId, error);
        return {
          ...data,
          stats: null
        };
      }
    },
    enabled: !!userId,
  });
}
