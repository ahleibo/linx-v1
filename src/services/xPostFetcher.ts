
import { XPostData } from './postImportService';

export class XPostFetcher {
  // Parse X post URL to extract post ID and username
  static parseXUrl(url: string): { postId: string; username: string } | null {
    const cleanUrl = url.trim().replace(/\?.*$/, '');
    
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

  // Fetch post data from X/Twitter URL
  static async fetchPostData(url: string): Promise<XPostData | null> {
    console.log('Fetching post data for URL:', url);
    
    const parsed = this.parseXUrl(url);
    if (!parsed) {
      console.error('Could not parse X URL:', url);
      return null;
    }

    console.log('Parsed URL data:', parsed);

    try {
      // Try multiple methods to get tweet content
      const methods = [
        () => this.fetchViaOEmbed(url, parsed),
        () => this.fetchViaProxy(url, parsed),
        () => this.fetchViaMetaTags(url, parsed)
      ];

      for (const method of methods) {
        try {
          const result = await method();
          if (result && result.content) {
            console.log('Successfully fetched tweet data:', result);
            return result;
          }
        } catch (error) {
          console.warn('Method failed, trying next:', error);
          continue;
        }
      }

      // If all methods fail, create basic post
      console.log('All methods failed, creating basic post');
      return this.createBasicPost(url, parsed);

    } catch (error) {
      console.error('Error fetching post:', error);
      return this.createBasicPost(url, parsed);
    }
  }

  private static createBasicPost(url: string, parsed: { username: string; postId: string }): XPostData {
    return {
      url,
      content: `Check out this post from @${parsed.username}`,
      authorName: parsed.username,
      authorUsername: parsed.username,
      authorAvatar: `https://unavatar.io/x/${parsed.username}`,
      mediaUrls: [],
      likesCount: 0,
      retweetsCount: 0,
      repliesCount: 0,
      createdAt: new Date().toISOString()
    };
  }

  private static async fetchViaOEmbed(url: string, parsed: { username: string; postId: string }): Promise<XPostData | null> {
    try {
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;
      console.log('Trying oEmbed URL:', oembedUrl);
      
      const response = await fetch(oembedUrl);
      
      if (response.ok) {
        const data = await response.json();
        console.log('oEmbed response:', data);
        
        if (data.html) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(data.html, 'text/html');
          
          // Extract tweet text from the HTML
          const tweetText = this.extractTweetTextFromHTML(doc.body);
          
          if (tweetText) {
            return {
              url,
              content: tweetText,
              authorName: data.author_name || parsed.username,
              authorUsername: parsed.username,
              authorAvatar: `https://unavatar.io/x/${parsed.username}`,
              mediaUrls: [],
              likesCount: 0,
              retweetsCount: 0,
              repliesCount: 0,
              createdAt: new Date().toISOString()
            };
          }
        }
      }
    } catch (error) {
      console.warn('oEmbed fetch failed:', error);
    }
    return null;
  }

  private static extractTweetTextFromHTML(element: HTMLElement): string {
    // Get all text content and clean it up
    let text = element.textContent || '';
    
    // Remove common Twitter UI elements
    text = text
      .replace(/pic\.twitter\.com\/\w+/g, '')
      .replace(/https?:\/\/t\.co\/\w+/g, '')
      .replace(/— .* \(@.*\).*$/g, '') // Remove attribution line
      .replace(/\d{1,2}:\d{2} [AP]M · .*/g, '') // Remove timestamp
      .replace(/\d+:\d+ [AP]M - .*/g, '') // Remove timestamp variant
      .trim();

    // If we got meaningful content, return it
    if (text && text.length > 5 && !text.match(/^https?:\/\//)) {
      return text;
    }
    
    return '';
  }

  private static async fetchViaProxy(url: string, parsed: { username: string; postId: string }): Promise<XPostData | null> {
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      console.log('Trying proxy URL:', proxyUrl);
      
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data.contents) {
        return this.extractFromHTML(data.contents, parsed, url);
      }
    } catch (error) {
      console.warn('Proxy fetch failed:', error);
    }
    return null;
  }

  private static async fetchViaMetaTags(url: string, parsed: { username: string; postId: string }): Promise<XPostData | null> {
    try {
      const metaUrl = `https://jsonlink.io/api/extract?url=${encodeURIComponent(url)}`;
      console.log('Trying meta extraction URL:', metaUrl);
      
      const response = await fetch(metaUrl);
      const data = await response.json();
      
      if (data.description) {
        const cleanDescription = this.cleanExtractedText(data.description);
        const authorName = this.extractAuthorFromTitle(data.title || '', parsed.username);
        
        // Return the content we found
        if (cleanDescription) {
          return {
            url,
            content: cleanDescription,
            authorName,
            authorUsername: parsed.username,
            authorAvatar: `https://unavatar.io/x/${parsed.username}`,
            mediaUrls: data.images && data.images.length > 0 ? [data.images[0]] : [],
            likesCount: 0,
            retweetsCount: 0,
            repliesCount: 0,
            createdAt: new Date().toISOString()
          };
        }
      }
    } catch (error) {
      console.warn('Meta tags fetch failed:', error);
    }
    return null;
  }

  private static extractFromHTML(html: string, parsed: { username: string; postId: string }, url: string): XPostData | null {
    try {
      // Look for Twitter/X meta tags that contain the actual tweet content
      const contentPatterns = [
        /<meta property="twitter:description" content="([^"]*)"[^>]*>/i,
        /<meta name="twitter:description" content="([^"]*)"[^>]*>/i,
        /<meta property="og:description" content="([^"]*)"[^>]*>/i,
        /<meta name="description" content="([^"]*)"[^>]*>/i,
      ];

      let content = '';
      let authorName = '';

      // Extract content from meta tags
      for (const pattern of contentPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          const extracted = this.cleanExtractedText(match[1]);
          if (extracted) {
            content = extracted;
            break;
          }
        }
      }

      // Extract author name from title
      const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
      if (titleMatch) {
        authorName = this.extractAuthorFromTitle(titleMatch[1], parsed.username);
      }

      // Return whatever content we found
      if (content) {
        return {
          url,
          content,
          authorName: authorName || parsed.username,
          authorUsername: parsed.username,
          authorAvatar: `https://unavatar.io/x/${parsed.username}`,
          mediaUrls: [],
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
    if (!title) return username;
    
    const patterns = [
      /^([^"(]+?)\s+on\s+X:/i,
      /^([^"(]+?)\s*\([^)]*@[^)]*\):/i,
      /^([^-]+?)\s*-\s*@/i,
      /^([^/]+?)\s*\/\s*X/i,
      /^"([^"]+)"/i,
      /^([^-|(]+)/
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1] && match[1].trim()) {
        const name = match[1].trim();
        if (name.length > 0 && name.length < 50 && name !== 'X') {
          return name;
        }
      }
    }
    
    return username;
  }

  private static cleanExtractedText(text: string): string {
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
      .replace(/^["']|["']$/g, '')
      .trim();
  }
}
