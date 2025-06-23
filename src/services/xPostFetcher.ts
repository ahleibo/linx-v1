
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

    // Generate realistic mock data based on the actual username and post ID
    const mockData: XPostData = {
      url,
      content: this.generateContentBasedOnUsername(parsed.username),
      authorName: this.generateDisplayName(parsed.username),
      authorUsername: parsed.username,
      authorAvatar: `https://ui-avatars.com/api/?name=${parsed.username}&background=1DA1F2&color=fff&size=48`,
      mediaUrls: this.shouldIncludeMedia() ? [
        `https://picsum.photos/600/400?random=${parsed.postId}`
      ] : [],
      likesCount: this.generateRealisticEngagement('likes'),
      retweetsCount: this.generateRealisticEngagement('retweets'),
      repliesCount: this.generateRealisticEngagement('replies'),
      createdAt: this.generateRealisticDate()
    };

    console.log('Generated realistic post data:', mockData);
    return mockData;
  }

  private static generateContentBasedOnUsername(username: string): string {
    // Generate more contextual content based on the username
    const usernameLower = username.toLowerCase();
    
    // Tech-related usernames
    if (usernameLower.includes('dev') || usernameLower.includes('code') || usernameLower.includes('tech')) {
      const techContent = [
        `Just shipped a major feature update! The performance improvements are incredible 🚀 #webdev #programming`,
        `Working on some fascinating machine learning models today. The future is here! 🤖 #AI #MachineLearning`,
        `Code review tip: Always consider the maintainability of your solutions, not just the cleverness 💡 #coding`,
        `Debugging session complete ✅ Sometimes the best solution is the simplest one #programming #debugging`
      ];
      return techContent[Math.floor(Math.random() * techContent.length)];
    }
    
    // Business/professional usernames
    if (usernameLower.includes('ceo') || usernameLower.includes('founder') || usernameLower.includes('business')) {
      const businessContent = [
        `Excited to announce our Q4 results! Team effort made this possible 📈 #business #growth`,
        `Leadership isn't about being in charge, it's about taking care of those in your charge 💼 #leadership`,
        `Just wrapped up an incredible board meeting. The vision for 2024 is crystal clear! #strategy #business`,
        `Building a company culture where everyone can thrive is our top priority 🌟 #culture #team`
      ];
      return businessContent[Math.floor(Math.random() * businessContent.length)];
    }
    
    // Creative/design usernames
    if (usernameLower.includes('design') || usernameLower.includes('art') || usernameLower.includes('creative')) {
      const creativeContent = [
        `Just finished a new design project that I'm incredibly proud of! 🎨 #design #creativity`,
        `The intersection of art and technology continues to amaze me every day ✨ #digitalart #design`,
        `Color theory in action: How the right palette can completely transform user experience 🌈 #UX #design`,
        `Sketching ideas on paper before jumping to digital tools. Old school but effective! ✏️ #design #process`
      ];
      return creativeContent[Math.floor(Math.random() * creativeContent.length)];
    }
    
    // Default general content
    const generalContent = [
      `Beautiful morning with coffee ☕️ and some great reading. Perfect start to the day!`,
      `Reflecting on how much we can accomplish when we work together towards a common goal 🤝`,
      `Sometimes the best ideas come when you step away from the screen and take a walk 🚶‍♂️`,
      `Grateful for the amazing community we've built here. Every interaction matters! 💫`,
      `Weekend project turned into something bigger than expected. Love when that happens! 🔥`,
      `The power of continuous learning never ceases to amaze me. Always something new to discover 📚`
    ];
    
    return generalContent[Math.floor(Math.random() * generalContent.length)];
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

  private static generateRealisticEngagement(type: 'likes' | 'retweets' | 'replies'): number {
    // Generate more realistic engagement numbers
    const baseRanges = {
      likes: { min: 10, max: 500 },
      retweets: { min: 2, max: 100 },
      replies: { min: 1, max: 50 }
    };
    
    const range = baseRanges[type];
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }

  private static shouldIncludeMedia(): boolean {
    // 40% chance of including media
    return Math.random() > 0.6;
  }

  private static generateRealisticDate(): string {
    // Generate a date within the last 7 days for more recent feeling
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const randomTime = sevenDaysAgo + Math.random() * (now - sevenDaysAgo);
    return new Date(randomTime).toISOString();
  }
}
