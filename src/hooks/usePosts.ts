
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
    error
  } = useQuery({
    queryKey: ['posts'],
    queryFn: () => postService.getUserPosts(),
  });

  // Search posts
  const [searchQuery, setSearchQuery] = useState('');
  
  // Search all posts (for explore page)
  const { data: allSearchResults = [], isLoading: isSearchingAll } = useQuery({
    queryKey: ['posts', 'search', 'all', searchQuery],
    queryFn: () => postService.searchAllPosts(searchQuery),
    enabled: searchQuery.length > 0,
  });

  // Search user's own posts (for profile page)
  const { data: userSearchResults = [], isLoading: isSearchingUser } = useQuery({
    queryKey: ['posts', 'search', 'user', searchQuery],
    queryFn: () => postService.searchUserPosts(searchQuery),
    enabled: searchQuery.length > 0,
  });

  // Search recent posts from network (for homepage)
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

  // Filter posts locally based on search query (for immediate results)
  const filteredPosts = searchQuery 
    ? posts.filter(post => 
        post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author_username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
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
