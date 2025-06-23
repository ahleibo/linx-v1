
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

  // Fetch post data from X/Twitter URL - works with minimal info
  static async fetchPostData(url: string): Promise<XPostData | null> {
    console.log('Fetching post data for URL:', url);
    
    const parsed = this.parseXUrl(url);
    if (!parsed) {
      console.error('Could not parse X URL:', url);
      return null;
    }

    console.log('Parsed URL data:', parsed);

    try {
      // Try Twitter's oEmbed API first
      const result = await this.fetchViaOEmbed(url, parsed);
      if (result) {
        console.log('Successfully fetched tweet data via oEmbed:', result);
        return result;
      }

      // Try fetching via proxy
      const proxyResult = await this.fetchViaProxy(url, parsed);
      if (proxyResult) {
        console.log('Successfully fetched tweet data via proxy:', proxyResult);
        return proxyResult;
      }

      // Try meta extraction service
      const metaResult = await this.fetchViaMetaTags(url, parsed);
      if (metaResult) {
        console.log('Successfully fetched tweet data via meta tags:', metaResult);
        return metaResult;
      }

      // If all else fails, create a basic post with minimal info
      console.log('Creating basic post with minimal available info');
      return this.createBasicPost(url, parsed);

    } catch (error) {
      console.error('Error fetching post:', error);
      // Fallback to basic post even on error
      return this.createBasicPost(url, parsed);
    }
  }

  private static createBasicPost(url: string, parsed: { username: string; postId: string }): XPostData {
    return {
      url,
      content: `Post from @${parsed.username}`,
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
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = data.html;
          
          const tweetText = this.extractTweetTextFromHTML(tempDiv);
          
          return {
            url,
            content: tweetText || `Post from @${parsed.username}`,
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
    } catch (error) {
      console.warn('oEmbed fetch failed:', error);
    }
    return null;
  }

  private static extractTweetTextFromHTML(element: HTMLElement): string {
    const selectors = [
      'p',
      '.tweet-text',
      '[data-testid="tweetText"]',
      '.js-tweet-text',
      'blockquote p'
    ];

    for (const selector of selectors) {
      const textElement = element.querySelector(selector);
      if (textElement) {
        // Fix TypeScript error by using textContent which exists on Element
        let text = textElement.textContent || '';
        text = this.cleanExtractedText(text);
        
        if (text && text.length > 10) {
          return text;
        }
      }
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
        const authorName = this.extractAuthorFromTitle(data.title || '', parsed.username);
        
        return {
          url,
          content: this.cleanExtractedText(data.description),
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
    } catch (error) {
      console.warn('Meta tags fetch failed:', error);
    }
    return null;
  }

  private static extractFromHTML(html: string, parsed: { username: string; postId: string }, url: string): XPostData | null {
    try {
      const contentPatterns = [
        /<meta property="twitter:description" content="([^"]*)"[^>]*>/i,
        /<meta name="twitter:description" content="([^"]*)"[^>]*>/i,
        /<meta property="og:description" content="([^"]*)"[^>]*>/i,
        /<meta name="description" content="([^"]*)"[^>]*>/i,
      ];

      let content = '';
      let authorName = '';

      for (const pattern of contentPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          content = this.cleanExtractedText(match[1]);
          break;
        }
      }

      const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
      if (titleMatch) {
        authorName = this.extractAuthorFromTitle(titleMatch[1], parsed.username);
      }

      return {
        url,
        content: content || `Post from @${parsed.username}`,
        authorName: authorName || parsed.username,
        authorUsername: parsed.username,
        authorAvatar: `https://unavatar.io/x/${parsed.username}`,
        mediaUrls: [],
        likesCount: 0,
        retweetsCount: 0,
        repliesCount: 0,
        createdAt: new Date().toISOString()
      };
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
