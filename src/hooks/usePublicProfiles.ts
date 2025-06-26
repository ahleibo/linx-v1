
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
  };
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
          const { data: statsData } = await supabase.rpc('get_user_public_stats', {
            user_uuid: profile.id
          });

          return {
            ...profile,
            stats: statsData
          };
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

      const { data: statsData } = await supabase.rpc('get_user_public_stats', {
        user_uuid: userId
      });

      return {
        ...data,
        stats: statsData
      };
    },
    enabled: !!userId,
  });
}
