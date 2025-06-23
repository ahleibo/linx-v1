
export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  description?: string;
  profile_image_url?: string;
  verified?: boolean;
  verified_type?: 'blue' | 'business' | 'government';
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
}

export interface TwitterMedia {
  media_key: string;
  type: 'photo' | 'video' | 'animated_gif';
  url?: string;
  preview_image_url?: string;
  alt_text?: string;
  width?: number;
  height?: number;
  duration_ms?: number;
  public_metrics?: {
    view_count?: number;
  };
}

export interface TwitterHashtag {
  start: number;
  end: number;
  tag: string;
}

export interface TwitterMention {
  start: number;
  end: number;
  username: string;
  id?: string;
}

export interface TwitterUrl {
  start: number;
  end: number;
  url: string;
  expanded_url?: string;
  display_url?: string;
  title?: string;
  description?: string;
  unwound_url?: string;
}

export interface TwitterEntities {
  hashtags?: TwitterHashtag[];
  mentions?: TwitterMention[];
  urls?: TwitterUrl[];
}

export interface TwitterPublicMetrics {
  retweet_count: number;
  like_count: number;
  reply_count: number;
  quote_count: number;
  bookmark_count?: number;
  impression_count?: number;
}

export interface TwitterReferencedTweet {
  type: 'retweeted' | 'quoted' | 'replied_to';
  id: string;
}

export interface TwitterTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  conversation_id?: string;
  in_reply_to_user_id?: string;
  referenced_tweets?: TwitterReferencedTweet[];
  public_metrics?: TwitterPublicMetrics;
  entities?: TwitterEntities;
  context_annotations?: any[];
  lang?: string;
  possibly_sensitive?: boolean;
  source?: string;
}

export interface TwitterApiResponse {
  data: TwitterTweet;
  includes?: {
    users?: TwitterUser[];
    tweets?: TwitterTweet[];
    media?: TwitterMedia[];
  };
}

export interface EnhancedXPostData {
  id: string;
  url: string;
  content: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  authorVerified?: boolean;
  authorVerifiedType?: string;
  mediaUrls?: string[];
  media?: TwitterMedia[];
  likesCount: number;
  retweetsCount: number;
  repliesCount: number;
  quotesCount?: number;
  bookmarksCount?: number;
  impressionsCount?: number;
  createdAt: string;
  entities?: TwitterEntities;
  referencedTweets?: TwitterReferencedTweet[];
  conversationId?: string;
  lang?: string;
  source?: string;
  possiblySensitive?: boolean;
}
