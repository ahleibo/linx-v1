
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

  // Enhanced function to generate more realistic post data based on URL
  static async fetchPostData(url: string): Promise<XPostData | null> {
    console.log('Fetching post data for URL:', url);
    
    const parsed = this.parseXUrl(url);
    if (!parsed) {
      console.error('Could not parse X URL:', url);
      return null;
    }

    console.log('Parsed URL data:', parsed);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate more realistic mock data based on the actual username and post ID
    const mockData: XPostData = {
      url,
      content: this.generateRealisticContent(parsed.username),
      authorName: this.generateDisplayName(parsed.username),
      authorUsername: parsed.username,
      authorAvatar: `https://ui-avatars.com/api/?name=${parsed.username}&background=1DA1F2&color=fff&size=48`,
      mediaUrls: Math.random() > 0.5 ? [
        `https://picsum.photos/600/400?random=${parsed.postId}`
      ] : [],
      likesCount: Math.floor(Math.random() * 10000),
      retweetsCount: Math.floor(Math.random() * 1000),
      repliesCount: Math.floor(Math.random() * 500),
      createdAt: this.generateRealisticDate()
    };

    console.log('Generated post data:', mockData);
    return mockData;
  }

  private static generateRealisticContent(username: string): string {
    const contentTemplates = [
      `Just shipped a new feature! Excited to see how the community responds. 🚀 #coding #webdev`,
      `Working on some interesting AI projects lately. The possibilities are endless! 🤖 #ai #machinelearning`,
      `Beautiful sunset today. Sometimes you need to step away from the screen and appreciate nature 🌅`,
      `Hot take: The best code is the code you don't have to write. Simplicity wins every time. 💯`,
      `Coffee shop coding session complete ☕️ There's something magical about changing your environment`,
      `Debugging is like being a detective in a crime movie where you're also the murderer 🕵️‍♂️ #programming`,
      `Just finished reading an amazing book on product design. Highly recommend it! 📚`,
      `The future of web development is looking incredibly exciting. Can't wait to see what's next! 🌐`
    ];
    
    return contentTemplates[Math.floor(Math.random() * contentTemplates.length)];
  }

  private static generateDisplayName(username: string): string {
    // Generate a realistic display name based on username
    const firstName = username.charAt(0).toUpperCase() + username.slice(1, 4);
    const lastName = username.slice(-3).charAt(0).toUpperCase() + username.slice(-2);
    return `${firstName} ${lastName}`;
  }

  private static generateRealisticDate(): string {
    // Generate a date within the last 30 days
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    const randomTime = thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo);
    return new Date(randomTime).toISOString();
  }
}
