
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postService } from '@/services/postService';
import { aiService } from '@/services/aiService';
import { useToast } from '@/hooks/use-toast';
import { semanticSearch } from '@/services/semanticSearchService';

export function usePosts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user posts
  const {
    data: posts = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['posts'],
    queryFn: () => postService.getUserPosts(),
  });

  // Search posts
  const [searchQuery, setSearchQuery] = useState('');
  
  // Search all posts (for explore page) - now with semantic search
  const { data: allSearchResults = [], isLoading: isSearchingAll } = useQuery({
    queryKey: ['posts', 'search', 'all', searchQuery],
    queryFn: () => postService.searchAllPosts(searchQuery),
    enabled: searchQuery.length > 0,
  });

  // Search user's own posts (for profile page) - now with semantic search
  const { data: userSearchResults = [], isLoading: isSearchingUser } = useQuery({
    queryKey: ['posts', 'search', 'user', searchQuery],
    queryFn: () => postService.searchUserPosts(searchQuery),
    enabled: searchQuery.length > 0,
  });

  // Search recent posts from network (for homepage) - now with semantic search
  const { data: networkSearchResults = [], isLoading: isSearchingNetwork } = useQuery({
    queryKey: ['posts', 'search', 'network', searchQuery],
    queryFn: () => postService.searchNetworkPosts(searchQuery),
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

  // Enhanced local semantic filtering as fallback
  const filteredPosts = searchQuery 
    ? semanticSearch.searchPosts(posts, searchQuery)
    : posts;

  return {
    posts,
    filteredPosts,
    isLoading,
    error,
    allSearchResults,
    userSearchResults,
    networkSearchResults,
    isSearchingAll,
    isSearchingUser,
    isSearchingNetwork,
    searchQuery,
    setSearchQuery,
    chatMutation,
    savePostMutation
  };
}
