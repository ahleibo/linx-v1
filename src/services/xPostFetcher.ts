
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
      // Try multiple approaches to get post data
      const methods = [
        () => this.fetchViaAllOrigins(url),
        () => this.fetchViaAlternateProxy(url),
        () => this.fetchDirectMetadata(url)
      ];

      for (const method of methods) {
        try {
          const result = await method();
          if (result && result.content && result.content.length > 20) {
            console.log('Successfully extracted real post data:', result);
            return result;
          }
        } catch (error) {
          console.warn('Method failed, trying next approach:', error);
          continue;
        }
      }
    } catch (error) {
      console.warn('All methods failed, using enhanced fallback:', error);
    }

    // Enhanced fallback with more realistic preview
    const fallbackData: XPostData = {
      url,
      content: `Unable to fetch full content. Please view the original post at ${url}`,
      authorName: this.generateDisplayName(parsed.username),
      authorUsername: parsed.username,
      authorAvatar: `https://ui-avatars.com/api/?name=${parsed.username}&background=1DA1F2&color=fff&size=48`,
      mediaUrls: [],
      likesCount: 0,
      retweetsCount: 0,
      repliesCount: 0,
      createdAt: new Date().toISOString()
    };

    console.log('Using enhanced fallback post data:', fallbackData);
    return fallbackData;
  }

  private static async fetchViaAllOrigins(url: string): Promise<XPostData | null> {
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    
    if (data.contents) {
      const parsed = this.parseXUrl(url);
      if (!parsed) return null;
      
      return this.extractPostDataFromHTML(data.contents, parsed, url);
    }
    return null;
  }

  private static async fetchViaAlternateProxy(url: string): Promise<XPostData | null> {
    try {
      // Try with a different proxy service
      const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
      const html = await response.text();
      
      const parsed = this.parseXUrl(url);
      if (!parsed) return null;
      
      return this.extractPostDataFromHTML(html, parsed, url);
    } catch (error) {
      console.warn('Alternate proxy failed:', error);
      return null;
    }
  }

  private static async fetchDirectMetadata(url: string): Promise<XPostData | null> {
    try {
      // Try to fetch just the meta tags using a meta tag extraction service
      const response = await fetch(`https://jsonlink.io/api/extract?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      const parsed = this.parseXUrl(url);
      if (!parsed) return null;

      if (data.title || data.description) {
        return {
          url,
          content: data.description || data.title || 'Content preview unavailable',
          authorName: this.extractAuthorFromTitle(data.title, parsed.username),
          authorUsername: parsed.username,
          authorAvatar: data.images?.[0] || `https://ui-avatars.com/api/?name=${parsed.username}&background=1DA1F2&color=fff&size=48`,
          mediaUrls: data.images ? [data.images[0]] : [],
          likesCount: 0,
          retweetsCount: 0,
          repliesCount: 0,
          createdAt: new Date().toISOString()
        };
      }
    } catch (error) {
      console.warn('Direct metadata fetch failed:', error);
    }
    return null;
  }

  private static extractPostDataFromHTML(html: string, parsed: { username: string; postId: string }, url: string): XPostData | null {
    try {
      // Extract Open Graph and Twitter Card meta tags with improved patterns
      const titleMatch = html.match(/<meta property="og:title" content="([^"]*)"/) || 
                        html.match(/<meta name="twitter:title" content="([^"]*)"/) ||
                        html.match(/<title>([^<]*)<\/title>/);
      
      const descriptionMatch = html.match(/<meta property="og:description" content="([^"]*)"/) ||
                              html.match(/<meta name="twitter:description" content="([^"]*)"/) ||
                              html.match(/<meta name="description" content="([^"]*)"/);
      
      const imageMatch = html.match(/<meta property="og:image" content="([^"]*)"/) ||
                        html.match(/<meta name="twitter:image" content="([^"]*)"/);

      // Enhanced content extraction
      let content = '';
      if (descriptionMatch && descriptionMatch[1]) {
        content = this.cleanExtractedText(descriptionMatch[1]);
      } else if (titleMatch && titleMatch[1]) {
        const title = titleMatch[1];
        // Try to extract tweet text from various title formats
        const patterns = [
          /^.*?on X: "(.+)"$/,
          /^.*?: "(.+)"$/,
          /^(.+) \/ X$/,
          /^(.+) - @\w+/
        ];
        
        for (const pattern of patterns) {
          const match = title.match(pattern);
          if (match) {
            content = this.cleanExtractedText(match[1]);
            break;
          }
        }
        
        if (!content) {
          content = this.cleanExtractedText(title);
        }
      }

      // If still no content, try to find it in the HTML body
      if (!content || content.length < 10) {
        const bodyContentMatch = html.match(/<meta name="twitter:description" content="([^"]+)"/);
        if (bodyContentMatch) {
          content = this.cleanExtractedText(bodyContentMatch[1]);
        }
      }

      if (!content || content.length < 5) {
        content = `Content from @${parsed.username} - Full content available at ${url}`;
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
    const patterns = [
      /<meta name="twitter:creator" content="@?([^"]*)"/, 
      /<meta property="og:site_name" content="([^"]*)"/, 
      new RegExp(`<title>([^(]*?)\\s*\\(.*?@${username}`, 'i'),
      new RegExp(`<meta property="og:title" content="([^(]*?)\\s*\\(.*?@${username}`, 'i')
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].trim()) {
        return match[1].trim();
      }
    }
    
    return this.generateDisplayName(username);
  }

  private static extractAuthorFromTitle(title: string, username: string): string {
    if (!title) return this.generateDisplayName(username);
    
    const patterns = [
      new RegExp(`^([^(]+)\\s*\\(.*?@${username}`, 'i'),
      /^([^-]+)\s*-\s*@/,
      /^([^/]+)\s*\//
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
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
      .replace(/&hellip;/g, '...')
      .replace(/&nbsp;/g, ' ')
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
