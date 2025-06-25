import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Post = Database['public']['Tables']['posts']['Row'];
type PostInsert = Database['public']['Tables']['posts']['Insert'];
type Topic = Database['public']['Tables']['topics']['Row'];

export const postService = {
  // Get posts for the current user's feed
  async getUserPosts(limit = 20, offset = 0) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        post_topics (
          topics (
            id,
            name,
            color
          )
        )
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  },

  // Search all posts (for explore page)
  async searchAllPosts(query: string, limit = 20) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        post_topics (
          topics (
            id,
            name,
            color
          )
        )
      `)
      .or(`content.ilike.%${query}%,author_name.ilike.%${query}%,author_username.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Search user's own posts (for profile page)
  async searchUserPosts(query: string, limit = 20) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        post_topics (
          topics (
            id,
            name,
            color
          )
        )
      `)
      .eq('user_id', user?.id)
      .or(`content.ilike.%${query}%,author_name.ilike.%${query}%,author_username.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Search network posts (for homepage - currently same as all posts, but could be refined)
  async searchNetworkPosts(query: string, limit = 20) {
    return this.searchAllPosts(query, limit);
  },

  // Legacy search method (keeping for backward compatibility)
  async searchPosts(query: string, limit = 20) {
    return this.searchAllPosts(query, limit);
  },

  // Get a single post with all its data
  async getPostById(id: string) {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        post_topics (
          topics (
            id,
            name,
            color
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Save a new post from X
  async savePost(postData: PostInsert) {
    const { data, error } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all topics
  async getTopics() {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  // Get posts by topic
  async getPostsByTopic(topicId: string, limit = 20) {
    const { data, error } = await supabase
      .from('post_topics')
      .select(`
        posts (
          *,
          post_topics (
            topics (
              id,
              name,
              color
            )
          )
        )
      `)
      .eq('topic_id', topicId)
      .limit(limit);

    if (error) throw error;
    return data?.map(item => item.posts).filter(Boolean);
  },

  // Assign topic to post (AI or manual)
  async assignTopicToPost(postId: string, topicId: string, isManual = false, confidence = 0.8) {
    const { data, error } = await supabase
      .from('post_topics')
      .insert({
        post_id: postId,
        topic_id: topicId,
        is_manual: isManual,
        confidence_score: confidence
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
