
import { supabase } from '@/integrations/supabase/client';

export interface XPostData {
  url: string;
  content: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  mediaUrls?: string[];
  likesCount?: number;
  retweetsCount?: number;
  repliesCount?: number;
  createdAt: string;
}

export const postImportService = {
  // Parse X post URL to extract post ID
  parseXUrl(url: string): string | null {
    const patterns = [
      /x\.com\/\w+\/status\/(\d+)/,
      /twitter\.com\/\w+\/status\/(\d+)/,
      /mobile\.x\.com\/\w+\/status\/(\d+)/,
      /mobile\.twitter\.com\/\w+\/status\/(\d+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  },

  // Import a single post
  async importPost(postData: XPostData) {
    console.log('Starting import for post:', postData.url);
    
    // Get current user session with better error handling
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Authentication error: ' + sessionError.message);
    }
    
    if (!session?.user) {
      console.error('No authenticated user found');
      throw new Error('You must be logged in to import posts. Please sign in and try again.');
    }
    
    console.log('User authenticated, proceeding with import. User ID:', session.user.id);
    
    const postId = this.parseXUrl(postData.url);
    
    try {
      const { data, error } = await supabase.functions.invoke('save-post', {
        body: {
          xPostId: postId || `manual_${Date.now()}`,
          authorName: postData.authorName,
          authorUsername: postData.authorUsername,
          authorAvatar: postData.authorAvatar,
          content: postData.content,
          mediaUrls: postData.mediaUrls || [],
          createdAt: postData.createdAt,
          likesCount: postData.likesCount || 0,
          retweetsCount: postData.retweetsCount || 0,
          repliesCount: postData.repliesCount || 0,
          xUrl: postData.url
        }
      });

      console.log('Import response:', { data, error });

      if (error) {
        console.error('Import error details:', error);
        
        // Provide more specific error messages
        if (error.message?.includes('Edge Function returned a non-2xx status code')) {
          throw new Error('Failed to save post. Please check your internet connection and try again.');
        } else if (error.message?.includes('Authentication')) {
          throw new Error('Authentication failed. Please sign out and sign back in.');
        } else {
          throw new Error(`Import failed: ${error.message || 'Unknown error occurred'}`);
        }
      }
      
      return data;
    } catch (functionError) {
      console.error('Function invocation error:', functionError);
      
      if (functionError.message?.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      throw functionError;
    }
  },

  // Import multiple posts
  async importMultiplePosts(posts: XPostData[]) {
    const results = [];
    
    for (const post of posts) {
      try {
        const result = await this.importPost(post);
        results.push({ success: true, post, result });
      } catch (error) {
        console.error('Failed to import post:', post.url, error);
        results.push({ success: false, post, error: error.message || 'Unknown error' });
      }
    }
    
    return results;
  }
};
