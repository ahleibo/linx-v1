
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
      // Try Twitter's oEmbed API first - this gives us real content
      const result = await this.fetchViaOEmbed(url);
      if (result) {
        console.log('Successfully fetched real tweet data via oEmbed:', result);
        return result;
      }

      // Try fetching via proxy to get meta tags
      const proxyResult = await this.fetchViaProxy(url);
      if (proxyResult) {
        console.log('Successfully fetched real tweet data via proxy:', proxyResult);
        return proxyResult;
      }

      // Try meta extraction service
      const metaResult = await this.fetchViaMetaTags(url);
      if (metaResult) {
        console.log('Successfully fetched real tweet data via meta tags:', metaResult);
        return metaResult;
      }

    } catch (error) {
      console.error('All methods failed:', error);
    }

    console.log('Could not fetch real tweet data, URL may be invalid or inaccessible');
    return null;
  }

  private static async fetchViaOEmbed(url: string): Promise<XPostData | null> {
    try {
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;
      console.log('Trying oEmbed URL:', oembedUrl);
      
      const response = await fetch(oembedUrl);
      
      if (response.ok) {
        const data = await response.json();
        console.log('oEmbed response:', data);
        
        if (data.html) {
          const parsed = this.parseXUrl(url);
          if (!parsed) return null;

          // Extract content from oEmbed HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = data.html;
          
          // Try to extract tweet text from the HTML
          const tweetText = this.extractTweetTextFromHTML(tempDiv);
          
          if (tweetText && tweetText.length > 10) {
            return {
              url,
              content: tweetText,
              authorName: data.author_name || parsed.username,
              authorUsername: parsed.username,
              authorAvatar: data.author_url ? `${data.author_url}/profile_image` : `https://unavatar.io/x/${parsed.username}`,
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
    // Look for the tweet text in various possible locations
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
        let text = textElement.textContent || textElement.innerText || '';
        text = this.cleanExtractedText(text);
        
        // Filter out non-tweet content
        if (text && 
            text.length > 10 && 
            !text.toLowerCase().includes('sign up') &&
            !text.toLowerCase().includes('log in') &&
            !text.toLowerCase().includes('follow') &&
            !text.includes('pic.twitter.com') &&
            !text.includes('— ')) {
          return text;
        }
      }
    }
    
    return '';
  }

  private static async fetchViaProxy(url: string): Promise<XPostData | null> {
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      console.log('Trying proxy URL:', proxyUrl);
      
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
      const metaUrl = `https://jsonlink.io/api/extract?url=${encodeURIComponent(url)}`;
      console.log('Trying meta extraction URL:', metaUrl);
      
      const response = await fetch(metaUrl);
      const data = await response.json();
      
      const parsed = this.parseXUrl(url);
      if (!parsed) return null;

      if (data.description && data.description.length > 20 && 
          !data.description.toLowerCase().includes('sign up') &&
          !data.description.toLowerCase().includes('the latest tweets')) {
        
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
      // Enhanced patterns to extract real tweet content
      const contentPatterns = [
        /<meta property="twitter:description" content="([^"]*)"[^>]*>/i,
        /<meta name="twitter:description" content="([^"]*)"[^>]*>/i,
        /<meta property="og:description" content="([^"]*)"[^>]*>/i,
        /<meta name="description" content="([^"]*)"[^>]*>/i,
      ];

      let content = '';
      let authorName = '';

      // Extract content
      for (const pattern of contentPatterns) {
        const match = html.match(pattern);
        if (match && match[1] && match[1].length > 20) {
          const extractedContent = this.cleanExtractedText(match[1]);
          
          // Validate this is actual tweet content
          if (this.isValidTweetContent(extractedContent)) {
            content = extractedContent;
            break;
          }
        }
      }

      // Extract author name from title
      const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
      if (titleMatch) {
        authorName = this.extractAuthorFromTitle(titleMatch[1], parsed.username);
      }

      // Only return if we have valid content
      if (content && content.length > 20) {
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

  private static isValidTweetContent(content: string): boolean {
    const invalidPhrases = [
      'sign up',
      'log in',
      'create account',
      'join twitter',
      'the latest tweets',
      'content from @',
      'unable to fetch',
      'error',
      'not found'
    ];

    const lowerContent = content.toLowerCase();
    return !invalidPhrases.some(phrase => lowerContent.includes(phrase));
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
