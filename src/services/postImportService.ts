
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
    
    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Your session has expired. Please sign out and sign back in.');
    }
    
    if (!session?.user) {
      console.error('No authenticated user found');
      throw new Error('You must be logged in to import posts. Please sign in.');
    }
    
    console.log('User authenticated, proceeding with import. User ID:', session.user.id);
    
    const postId = this.parseXUrl(postData.url);
    
    try {
      console.log('Invoking save-post function with data:', {
        xPostId: postId || `manual_${Date.now()}`,
        authorUsername: postData.authorUsername,
        contentPreview: postData.content.substring(0, 50) + '...'
      });

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

      console.log('Save-post function response:', { data, error });

      if (error) {
        console.error('Import error details:', error);
        
        // Handle specific authentication errors
        if (error.message?.includes('session is invalid') || 
            error.message?.includes('sign out and sign back in') ||
            error.message?.includes('authentication session')) {
          throw new Error('Your session has expired. Please sign out and sign back in to continue.');
        }
        
        throw new Error(`Import failed: ${error.message || 'Unknown error occurred'}`);
      }
      
      if (data?.success) {
        console.log('Post imported successfully:', data);
        return data;
      } else {
        console.error('Unexpected response format:', data);
        throw new Error('Post import completed but response format was unexpected');
      }
      
    } catch (functionError) {
      console.error('Function invocation error:', functionError);
      
      // Check if it's a network or authentication error
      if (functionError.message?.includes('session') || 
          functionError.message?.includes('auth')) {
        throw new Error('Authentication error. Please sign out and sign back in.');
      }
      
      throw functionError;
    }
  },

  // Import multiple posts
  async importMultiplePosts(posts: XPostData[]) {
    console.log(`Starting import of ${posts.length} posts`);
    const results = [];
    
    for (const post of posts) {
      try {
        const result = await this.importPost(post);
        results.push({ success: true, post, result });
        console.log(`Successfully imported post from @${post.authorUsername}`);
      } catch (error) {
        console.error('Failed to import post:', post.url, error);
        results.push({ success: false, post, error: error.message || 'Unknown error' });
      }
    }
    
    console.log(`Import complete: ${results.filter(r => r.success).length}/${posts.length} successful`);
    return results;
  }
};
