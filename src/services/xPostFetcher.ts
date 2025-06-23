
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
        () => this.fetchViaOEmbed(url),
        () => this.fetchViaProxy(url),
        () => this.fetchViaMetaTags(url)
      ];

      for (const method of methods) {
        try {
          const result = await method();
          if (result && result.content && result.content.length > 20 && !result.content.includes('Content from @')) {
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
      content: `Unable to fetch full content from this X post. Please check the original link: ${url}`,
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

  private static async fetchViaOEmbed(url: string): Promise<XPostData | null> {
    try {
      // Try Twitter's oEmbed API first
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`;
      const response = await fetch(oembedUrl);
      
      if (response.ok) {
        const data = await response.json();
        const parsed = this.parseXUrl(url);
        if (!parsed) return null;

        // Extract content from oEmbed HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data.html;
        const tweetText = tempDiv.querySelector('p')?.textContent || '';
        
        if (tweetText && tweetText.length > 5) {
          return {
            url,
            content: this.cleanExtractedText(tweetText),
            authorName: data.author_name || this.generateDisplayName(parsed.username),
            authorUsername: parsed.username,
            authorAvatar: `https://ui-avatars.com/api/?name=${parsed.username}&background=1DA1F2&color=fff&size=48`,
            mediaUrls: [],
            likesCount: 0,
            retweetsCount: 0,
            repliesCount: 0,
            createdAt: new Date().toISOString()
          };
        }
      }
    } catch (error) {
      console.warn('oEmbed fetch failed:', error);
    }
    return null;
  }

  private static async fetchViaProxy(url: string): Promise<XPostData | null> {
    try {
      // Use CORS proxy to fetch the page
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data.contents) {
        const parsed = this.parseXUrl(url);
        if (!parsed) return null;
        
        return this.extractFromHTML(data.contents, parsed, url);
      }
    } catch (error) {
      console.warn('Proxy fetch failed:', error);
    }
    return null;
  }

  private static async fetchViaMetaTags(url: string): Promise<XPostData | null> {
    try {
      // Try to get meta tags using a different service
      const metaUrl = `https://jsonlink.io/api/extract?url=${encodeURIComponent(url)}`;
      const response = await fetch(metaUrl);
      const data = await response.json();
      
      const parsed = this.parseXUrl(url);
      if (!parsed) return null;

      if (data.description && data.description.length > 10) {
        return {
          url,
          content: this.cleanExtractedText(data.description),
          authorName: data.title ? this.extractAuthorFromTitle(data.title, parsed.username) : this.generateDisplayName(parsed.username),
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
      console.warn('Meta tags fetch failed:', error);
    }
    return null;
  }

  private static extractFromHTML(html: string, parsed: { username: string; postId: string }, url: string): XPostData | null {
    try {
      // Enhanced HTML content extraction
      const patterns = [
        // Twitter card meta tags
        /<meta property="twitter:description" content="([^"]*)"[^>]*>/i,
        /<meta name="twitter:description" content="([^"]*)"[^>]*>/i,
        // Open Graph tags
        /<meta property="og:description" content="([^"]*)"[^>]*>/i,
        // Standard meta description
        /<meta name="description" content="([^"]*)"[^>]*>/i,
        // Try to find tweet text in JSON-LD
        /"text"\s*:\s*"([^"]*)"[^}]*"author"/i,
        // Try to extract from title patterns
        /<title>([^<]*)<\/title>/i
      ];

      let content = '';
      let authorName = '';
      let mediaUrl = '';

      // Extract content
      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1] && match[1].length > 10) {
          content = this.cleanExtractedText(match[1]);
          if (content && !content.includes('Sign up') && !content.includes('Log in')) {
            break;
          }
        }
      }

      // Extract author name from title
      const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
      if (titleMatch) {
        authorName = this.extractAuthorFromTitle(titleMatch[1], parsed.username);
      }

      // Extract media
      const imageMatch = html.match(/<meta property="og:image" content="([^"]*)"[^>]*>/i) ||
                        html.match(/<meta name="twitter:image" content="([^"]*)"[^>]*>/i);
      if (imageMatch) {
        mediaUrl = imageMatch[1];
      }

      // Only return if we got meaningful content
      if (content && content.length > 20 && !content.toLowerCase().includes('sign up')) {
        return {
          url,
          content,
          authorName: authorName || this.generateDisplayName(parsed.username),
          authorUsername: parsed.username,
          authorAvatar: `https://ui-avatars.com/api/?name=${parsed.username}&background=1DA1F2&color=fff&size=48`,
          mediaUrls: mediaUrl ? [mediaUrl] : [],
          likesCount: 0,
          retweetsCount: 0,
          repliesCount: 0,
          createdAt: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error extracting from HTML:', error);
    }
    return null;
  }

  private static extractAuthorFromTitle(title: string, username: string): string {
    if (!title) return this.generateDisplayName(username);
    
    // Common X/Twitter title patterns
    const patterns = [
      // "Name on X: "Tweet text""
      /^([^"(]+?)\s+on\s+X:/i,
      // "Name (@username): "Tweet text""
      /^([^"(]+?)\s*\([^)]*@[^)]*\):/i,
      // "Name - @username"
      /^([^-]+?)\s*-\s*@/i,
      // "Name / X"
      /^([^/]+?)\s*\/\s*X/i,
      // Just get the first part before any separator
      /^([^-|(]+)/
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1] && match[1].trim()) {
        const name = match[1].trim();
        if (name.length > 0 && name.length < 50) {
          return name;
        }
      }
    }
    
    return this.generateDisplayName(username);
  }

  private static cleanExtractedText(text: string): string {
    // Clean up extracted text
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
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .trim();
  }

  private static generateDisplayName(username: string): string {
    // Generate more realistic display names based on username
    const cleanUsername = username.replace(/[_\-0-9]+/g, '');
    
    if (cleanUsername.length > 2) {
      return cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);
    }
    
    // Fallback to capitalizing the original username
    return username.charAt(0).toUpperCase() + username.slice(1);
  }
}
