
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
    const postId = this.parseXUrl(postData.url);
    
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

    if (error) throw error;
    return data;
  },

  // Import multiple posts
  async importMultiplePosts(posts: XPostData[]) {
    const results = [];
    for (const post of posts) {
      try {
        const result = await this.importPost(post);
        results.push({ success: true, post, result });
      } catch (error) {
        results.push({ success: false, post, error });
      }
    }
    return results;
  }
};
