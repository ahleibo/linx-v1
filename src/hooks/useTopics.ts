
import { useQuery } from '@tanstack/react-query';
import { postService } from '@/services/postService';

export function useTopics() {
  const {
    data: topics = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['topics'],
    queryFn: postService.getTopics,
  });

  const getTopicById = (id: string) => {
    return topics.find(topic => topic.id === id);
  };

  const getPostsByTopic = (topicId: string) => {
    return useQuery({
      queryKey: ['posts', 'topic', topicId],
      queryFn: () => postService.getPostsByTopic(topicId),
      enabled: !!topicId,
    });
  };

  return {
    topics,
    isLoading,
    error,
    refetch,
    getTopicById,
    getPostsByTopic
  };
}
