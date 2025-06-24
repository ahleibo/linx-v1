
import { supabase } from '@/integrations/supabase/client';
import type { EnhancedXPostData } from '@/types/twitter';

export class XPostImportService {
  // Extract tweet ID from various X URL formats
  static extractTweetId(url: string): string | null {
    const patterns = [
      /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
      /(?:twitter\.com|x\.com)\/\w+\/statuses\/(\d+)/,
      /(?:mobile\.twitter\.com|mobile\.x\.com)\/\w+\/status\/(\d+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  }

  // Import a post from X URL
  static async importFromUrl(url: string): Promise<{ success: boolean; error?: string; post?: any; isExisting?: boolean }> {
    try {
      const tweetId = this.extractTweetId(url);
      if (!tweetId) {
        return { success: false, error: 'Invalid X/Twitter URL format. Please use a valid post URL.' };
      }

      console.log('Importing tweet with ID:', tweetId);

      // Call the fetch-tweet edge function
      const { data, error } = await supabase.functions.invoke('fetch-tweet', {
        body: { tweetId, url }
      });

      if (error) {
        console.error('Edge function error:', error);
        return { success: false, error: error.message || 'Failed to fetch tweet' };
      }

      if (!data || !data.data) {
        return { success: false, error: 'Tweet not found or may be private. Please check the URL and try again.' };
      }

      console.log('Tweet data received:', data);

      // Process the Twitter API response
      const processedData = this.processTwitterApiResponse(data, url);
      
      // Save the post using the existing save-post edge function
      const { data: savedPost, error: saveError } = await supabase.functions.invoke('save-post', {
        body: processedData
      });

      if (saveError) {
        console.error('Save post error:', saveError);
        return { success: false, error: saveError.message || 'Failed to save post' };
      }

      console.log('Post saved successfully:', savedPost);
      return { 
        success: true, 
        post: savedPost.post,
        isExisting: savedPost.isExisting 
      };
    } catch (error: any) {
      console.error('Import error:', error);
      return { success: false, error: error.message || 'Failed to import post. Please try again.' };
    }
  }

  // Process Twitter API response into our format
  private static processTwitterApiResponse(apiResponse: any, originalUrl: string) {
    const tweet = apiResponse.data;
    const includes = apiResponse.includes || {};
    const users = includes.users || [];
    const media = includes.media || [];

    // Find the author
    const author = users.find((user: any) => user.id === tweet.author_id) || {
      id: tweet.author_id,
      username: 'unknown',
      name: 'Unknown User'
    };

    // Process media URLs
    const mediaUrls: string[] = [];
    if (tweet.attachments?.media_keys) {
      tweet.attachments.media_keys.forEach((mediaKey: string) => {
        const mediaItem = media.find((m: any) => m.media_key === mediaKey);
        if (mediaItem?.url || mediaItem?.preview_image_url) {
          mediaUrls.push(mediaItem.url || mediaItem.preview_image_url);
        }
      });
    }

    return {
      xPostId: tweet.id,
      authorName: author.name,
      authorUsername: author.username,
      authorAvatar: author.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=1DA1F2&color=fff&size=48`,
      content: tweet.text,
      mediaUrls: mediaUrls,
      createdAt: tweet.created_at,
      likesCount: tweet.public_metrics?.like_count || 0,
      retweetsCount: tweet.public_metrics?.retweet_count || 0,
      repliesCount: tweet.public_metrics?.reply_count || 0,
      xUrl: originalUrl
    };
  }

  static async getImportHistory() {
    const { data, error } = await supabase
      .from('import_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching import history:', error);
      return [];
    }

    return data || [];
  }
}
