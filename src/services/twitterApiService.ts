
import { TwitterApiResponse, EnhancedXPostData } from '@/types/twitter';

export class TwitterApiService {
  private static readonly BASE_URL = 'https://api.twitter.com/2';
  
  // Parse various Twitter URL formats to extract tweet ID
  static parseTweetUrl(url: string): { tweetId: string; username?: string } | null {
    const cleanUrl = url.trim().replace(/\?.*$/, '');
    
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\/(\w+)\/status\/(\d+)/i,
      /(?:https?:\/\/)?(?:mobile\.)?(?:x|twitter)\.com\/(\w+)\/status\/(\d+)/i,
      /(?:https?:\/\/)?(?:mobile\.)?twitter\.com\/(\w+)\/status\/(\d+)/i
    ];
    
    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match) {
        return {
          username: match[1],
          tweetId: match[2]
        };
      }
    }
    return null;
  }

  // Validate Twitter URL format
  static validateTwitterUrl(url: string): boolean {
    return this.parseTweetUrl(url) !== null;
  }

  // Get tweet data via our Edge Function (which will use Twitter API v2)
  static async fetchTweetData(url: string): Promise<EnhancedXPostData | null> {
    console.log('Fetching tweet data for URL:', url);
    
    const parsed = this.parseTweetUrl(url);
    if (!parsed) {
      throw new Error('Invalid Twitter URL format');
    }

    // Always create a basic fallback post first
    const fallbackPost: EnhancedXPostData = {
      id: parsed.tweetId,
      url: url,
      content: `Check out this post from @${parsed.username}`,
      authorName: parsed.username,
      authorUsername: parsed.username,
      authorAvatar: `https://unavatar.io/x/${parsed.username}`,
      mediaUrls: [],
      likesCount: 0,
      retweetsCount: 0,
      repliesCount: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      // Try to get enhanced data from our Edge Function
      const response = await fetch('/functions/v1/fetch-tweet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tweetId: parsed.tweetId,
          url: url
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && !data.error) {
          return this.transformTwitterApiResponse(data, url);
        }
      }
    } catch (error) {
      console.warn('Edge function failed:', error);
    }

    try {
      // Try fallback XPostFetcher
      const { XPostFetcher } = await import('./xPostFetcher');
      const fallbackData = await XPostFetcher.fetchPostData(url);
      
      if (fallbackData && fallbackData.content && fallbackData.content.length > 10) {
        return {
          id: parsed.tweetId,
          url: fallbackData.url,
          content: fallbackData.content,
          authorName: fallbackData.authorName,
          authorUsername: fallbackData.authorUsername,
          authorAvatar: fallbackData.authorAvatar,
          mediaUrls: fallbackData.mediaUrls || [],
          likesCount: fallbackData.likesCount || 0,
          retweetsCount: fallbackData.retweetsCount || 0,
          repliesCount: fallbackData.repliesCount || 0,
          createdAt: fallbackData.createdAt,
        };
      }
    } catch (error) {
      console.warn('Fallback fetcher failed:', error);
    }
    
    // Always return the basic fallback post so the card can render
    console.log('Returning fallback post data:', fallbackPost);
    return fallbackPost;
  }

  // Transform Twitter API v2 response to our format
  private static transformTwitterApiResponse(apiResponse: TwitterApiResponse, originalUrl: string): EnhancedXPostData {
    const tweet = apiResponse.data;
    const author = apiResponse.includes?.users?.[0];
    const media = apiResponse.includes?.media || [];
    
    return {
      id: tweet.id,
      url: originalUrl,
      content: tweet.text,
      authorName: author?.name || 'Unknown',
      authorUsername: author?.username || 'unknown',
      authorAvatar: author?.profile_image_url?.replace('_normal', '_400x400'),
      authorVerified: author?.verified,
      authorVerifiedType: author?.verified_type,
      mediaUrls: media.map(m => m.url).filter(Boolean) as string[],
      media: media,
      likesCount: tweet.public_metrics?.like_count || 0,
      retweetsCount: tweet.public_metrics?.retweet_count || 0,
      repliesCount: tweet.public_metrics?.reply_count || 0,
      quotesCount: tweet.public_metrics?.quote_count || 0,
      bookmarksCount: tweet.public_metrics?.bookmark_count || 0,
      impressionsCount: tweet.public_metrics?.impression_count || 0,
      createdAt: tweet.created_at,
      entities: tweet.entities,
      referencedTweets: tweet.referenced_tweets,
      conversationId: tweet.conversation_id,
      lang: tweet.lang,
      source: tweet.source,
      possiblySensitive: tweet.possibly_sensitive
    };
  }

  // Extract hashtags from tweet text
  static extractHashtags(text: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const hashtags = [];
    let match;
    
    while ((match = hashtagRegex.exec(text)) !== null) {
      hashtags.push(match[1]);
    }
    
    return hashtags;
  }

  // Extract mentions from tweet text
  static extractMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  }

  // Format tweet text with clickable links
  static formatTweetText(text: string, entities?: any): string {
    if (!entities) return text;
    
    let formattedText = text;
    
    // Replace URLs
    if (entities.urls) {
      entities.urls.forEach((url: any) => {
        formattedText = formattedText.replace(
          url.url,
          `<a href="${url.expanded_url || url.url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">${url.display_url || url.url}</a>`
        );
      });
    }
    
    // Replace hashtags
    if (entities.hashtags) {
      entities.hashtags.forEach((hashtag: any) => {
        formattedText = formattedText.replace(
          `#${hashtag.tag}`,
          `<span class="text-blue-400">#${hashtag.tag}</span>`
        );
      });
    }
    
    // Replace mentions
    if (entities.mentions) {
      entities.mentions.forEach((mention: any) => {
        formattedText = formattedText.replace(
          `@${mention.username}`,
          `<span class="text-blue-400">@${mention.username}</span>`
        );
      });
    }
    
    return formattedText;
  }
}
