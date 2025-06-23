
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ProfileStats {
  totalPosts: number;
  totalCollections: number;
  monthlyPosts: number;
  topTopics: Array<{ name: string; count: number; percentage: number }>;
  averagePostsPerWeek: number;
  totalSavedThisYear: number;
}

export function useProfileStats() {
  const { user } = useAuth();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['profile-stats', user?.id],
    queryFn: async (): Promise<ProfileStats> => {
      if (!user?.id) throw new Error('No user found');

      // Get total posts count
      const { count: totalPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get total collections count
      const { count: totalCollections } = await supabase
        .from('collections')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get posts from current month
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const { count: monthlyPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('saved_at', currentMonth.toISOString());

      // Get top topics with post counts
      const { data: topicsData } = await supabase
        .from('post_topics')
        .select(`
          topic_id,
          topics(name, color)
        `)
        .eq('posts.user_id', user.id);

      // Process topics data
      const topicCounts = new Map<string, number>();
      topicsData?.forEach((item) => {
        if (item.topics) {
          const topicName = (item.topics as any).name;
          topicCounts.set(topicName, (topicCounts.get(topicName) || 0) + 1);
        }
      });

      const topTopics = Array.from(topicCounts.entries())
        .map(([name, count]) => ({
          name,
          count,
          percentage: Math.round((count / (totalPosts || 1)) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate average posts per week (last 4 weeks)
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const { count: recentPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('saved_at', fourWeeksAgo.toISOString());

      const averagePostsPerWeek = Math.round((recentPosts || 0) / 4);

      // Get posts saved this year
      const yearStart = new Date(new Date().getFullYear(), 0, 1);
      const { count: totalSavedThisYear } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('saved_at', yearStart.toISOString());

      return {
        totalPosts: totalPosts || 0,
        totalCollections: totalCollections || 0,
        monthlyPosts: monthlyPosts || 0,
        topTopics,
        averagePostsPerWeek,
        totalSavedThisYear: totalSavedThisYear || 0
      };
    },
    enabled: !!user?.id,
  });

  return {
    stats,
    isLoading,
    error
  };
}
