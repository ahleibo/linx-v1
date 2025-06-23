
import { XPostData } from './postImportService';

export class XPostFetcher {
  // Parse X post URL to extract post ID and username
  static parseXUrl(url: string): { postId: string; username: string } | null {
    // Clean up the URL first
    const cleanUrl = url.trim().replace(/\?.*$/, ''); // Remove query parameters
    
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\/(\w+)\/status\/(\d+)/i,
      /(?:https?:\/\/)?(?:mobile\.)?(?:x|twitter)\.com\/(\w+)\/status\/(\d+)/i
    ];
    
    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match) {
        return {
          username: match[1],
          postId: match[2]
        };
      }
    }
    return null;
  }

  // Fetch real post data from X/Twitter URL
  static async fetchPostData(url: string): Promise<XPostData | null> {
    console.log('Fetching real post data for URL:', url);
    
    const parsed = this.parseXUrl(url);
    if (!parsed) {
      console.error('Could not parse X URL:', url);
      return null;
    }

    console.log('Parsed URL data:', parsed);

    try {
      // Use a proxy service or scraping method to get real post data
      // For now, we'll try to extract basic information from the URL structure
      // and use open graph tags or similar methods
      
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (data.contents) {
        const htmlContent = data.contents;
        const postData = this.extractPostDataFromHTML(htmlContent, parsed, url);
        
        if (postData) {
          console.log('Successfully extracted real post data:', postData);
          return postData;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch real post data, falling back to URL-based extraction:', error);
    }

    // Fallback: Extract what we can from the URL and provide a basic preview
    const fallbackData: XPostData = {
      url,
      content: `Preview unavailable - Direct post link: ${url}`,
      authorName: this.generateDisplayName(parsed.username),
      authorUsername: parsed.username,
      authorAvatar: `https://ui-avatars.com/api/?name=${parsed.username}&background=1DA1F2&color=fff&size=48`,
      mediaUrls: [],
      likesCount: 0,
      retweetsCount: 0,
      repliesCount: 0,
      createdAt: new Date().toISOString()
    };

    console.log('Using fallback post data:', fallbackData);
    return fallbackData;
  }

  private static extractPostDataFromHTML(html: string, parsed: { username: string; postId: string }, url: string): XPostData | null {
    try {
      // Extract Open Graph and Twitter Card meta tags
      const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/) || 
                        html.match(/<meta name="twitter:title" content="([^"]*)"/) ||
                        html.match(/<title>([^<]*)<\/title>/);
      
      const descriptionMatch = html.match(/<meta property="og:description" content="([^"]*)"/) ||
                              html.match(/<meta name="twitter:description" content="([^"]*)"/) ||
                              html.match(/<meta name="description" content="([^"]*)"/);
      
      const imageMatch = html.match(/<meta property="og:image" content="([^"]*)"/) ||
                        html.match(/<meta name="twitter:image" content="([^"]*)"/);

      // Try to extract tweet text from the HTML structure
      let content = '';
      if (descriptionMatch && descriptionMatch[1]) {
        content = this.cleanExtractedText(descriptionMatch[1]);
      } else if (titleMatch && titleMatch[1]) {
        // Twitter titles often contain the username and tweet text
        const title = titleMatch[1];
        const tweetTextMatch = title.match(/^.*?on X: "(.+)"$/) || 
                              title.match(/^.*?: "(.+)"$/);
        if (tweetTextMatch) {
          content = this.cleanExtractedText(tweetTextMatch[1]);
        } else {
          content = this.cleanExtractedText(title);
        }
      }

      if (!content) {
        content = `Post from @${parsed.username} - View full content at ${url}`;
      }

      const authorName = this.extractAuthorName(html, parsed.username);
      const mediaUrls = imageMatch && imageMatch[1] ? [imageMatch[1]] : [];

      return {
        url,
        content,
        authorName,
        authorUsername: parsed.username,
        authorAvatar: `https://ui-avatars.com/api/?name=${parsed.username}&background=1DA1F2&color=fff&size=48`,
        mediaUrls,
        likesCount: 0,
        retweetsCount: 0,
        repliesCount: 0,
        createdAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error extracting post data from HTML:', error);
      return null;
    }
  }

  private static extractAuthorName(html: string, username: string): string {
    // Try to extract the display name from various meta tags
    const authorMatch = html.match(/<meta name="twitter:creator" content="@?([^"]*)"/) ||
                       html.match(/<meta property="og:site_name" content="([^"]*)"/) ||
                       html.match(new RegExp(`<title>([^(]*?)\\s*\\(.*?@${username}`, 'i'));
    
    if (authorMatch && authorMatch[1]) {
      return authorMatch[1].trim();
    }
    
    return this.generateDisplayName(username);
  }

  private static cleanExtractedText(text: string): string {
    // Clean up extracted text by decoding HTML entities and removing extra whitespace
    return text
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private static generateDisplayName(username: string): string {
    // Generate more realistic display names
    const patterns = [
      () => username.charAt(0).toUpperCase() + username.slice(1),
      () => {
        const first = username.slice(0, Math.max(3, username.length / 2));
        const last = username.slice(-Math.max(2, username.length / 3));
        return `${first.charAt(0).toUpperCase() + first.slice(1)} ${last.charAt(0).toUpperCase() + last.slice(1)}`;
      },
      () => {
        // For names with numbers, clean them up
        const cleaned = username.replace(/\d+/g, '');
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
    ];
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    return pattern();
  }
}
