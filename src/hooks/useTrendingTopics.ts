import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TrendingTopic {
  name: string;
  count: number;
  color: string;
}

export const useTrendingTopics = () => {
  return useQuery({
    queryKey: ['trending-topics'],
    queryFn: async (): Promise<TrendingTopic[]> => {
      // Get topics with their post counts from the last week
      const { data: topicsData, error } = await supabase
        .from('topics')
        .select(`
          name,
          color,
          post_topics!inner(
            posts!inner(
              created_at,
              user_id
            )
          )
        `);

      if (error) {
        console.error('Error fetching trending topics:', error);
        return [];
      }

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Process the data to count posts per topic for the current user
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const trendingTopics: TrendingTopic[] = topicsData
        .map(topic => {
          // Count posts from this week for the current user
          const postCount = topic.post_topics?.filter(pt => {
            const post = pt.posts;
            return post?.user_id === user.id && 
                   new Date(post.created_at) >= weekAgo;
          }).length || 0;

          return {
            name: topic.name,
            count: postCount,
            color: topic.color || '#3B82F6'
          };
        })
        .filter(topic => topic.count > 0) // Only show topics with posts
        .sort((a, b) => b.count - a.count) // Sort by count descending
        .slice(0, 4); // Limit to 4 topics

      return trendingTopics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};