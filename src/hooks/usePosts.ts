
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postService } from '@/services/postService';
import { aiService } from '@/services/aiService';
import { useToast } from '@/hooks/use-toast';

export function usePosts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user posts
  const {
    data: posts = [],
    isLoading,
    error,
    fetchNextPage,
    hasNextPage
  } = useQuery({
    queryKey: ['posts'],
    queryFn: () => postService.getUserPosts(),
  });

  // Search posts
  const [searchQuery, setSearchQuery] = useState('');
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: ['posts', 'search', searchQuery],
    queryFn: () => postService.searchPosts(searchQuery),
    enabled: searchQuery.length > 0,
  });

  // AI chat query
  const chatMutation = useMutation({
    mutationFn: aiService.processQuery,
    onSuccess: (data) => {
      console.log('AI Chat Response:', data);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process your query",
        variant: "destructive",
      });
    }
  });

  // Save post mutation
  const savePostMutation = useMutation({
    mutationFn: postService.savePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      toast({
        title: "Success",
        description: "Post saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive",
      });
    }
  });

  return {
    posts,
    isLoading,
    error,
    searchResults,
    isSearching,
    searchQuery,
    setSearchQuery,
    chatMutation,
    savePostMutation,
    fetchNextPage,
    hasNextPage
  };
}
