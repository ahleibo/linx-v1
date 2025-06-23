
-- Authors table for Twitter users
CREATE TABLE IF NOT EXISTS public.twitter_authors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  twitter_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  profile_image_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  verified_type TEXT, -- blue, business, government
  public_metrics JSONB, -- followers, following, tweet count, etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced posts table with complete metadata
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS twitter_author_id UUID REFERENCES public.twitter_authors(id);
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tweet_type TEXT DEFAULT 'tweet'; -- tweet, retweet, quote, reply
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS conversation_id TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS in_reply_to_user_id TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS referenced_tweets JSONB;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS public_metrics JSONB;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS context_annotations JSONB;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS entities JSONB;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS lang TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS possibly_sensitive BOOLEAN DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS import_status TEXT DEFAULT 'pending';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS import_source TEXT DEFAULT 'manual';

-- Media attachments table
CREATE TABLE IF NOT EXISTS public.tweet_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  media_key TEXT,
  type TEXT NOT NULL, -- photo, video, animated_gif
  url TEXT,
  preview_image_url TEXT,
  alt_text TEXT,
  width INTEGER,
  height INTEGER,
  duration_ms INTEGER,
  public_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Hashtags table
CREATE TABLE IF NOT EXISTS public.tweet_hashtags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  start_pos INTEGER,
  end_pos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Mentions table
CREATE TABLE IF NOT EXISTS public.tweet_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  mentioned_user_id TEXT,
  username TEXT NOT NULL,
  start_pos INTEGER,
  end_pos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- URLs table
CREATE TABLE IF NOT EXISTS public.tweet_urls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  expanded_url TEXT,
  display_url TEXT,
  title TEXT,
  description TEXT,
  unwound_url TEXT,
  start_pos INTEGER,
  end_pos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Import tracking table
CREATE TABLE IF NOT EXISTS public.import_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  twitter_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, success, failed
  error_message TEXT,
  tweet_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_twitter_authors_twitter_id ON public.twitter_authors(twitter_id);
CREATE INDEX IF NOT EXISTS idx_twitter_authors_username ON public.twitter_authors(username);
CREATE INDEX IF NOT EXISTS idx_posts_twitter_author_id ON public.posts(twitter_author_id);
CREATE INDEX IF NOT EXISTS idx_posts_x_post_id ON public.posts(x_post_id);
CREATE INDEX IF NOT EXISTS idx_posts_conversation_id ON public.posts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_tweet_media_post_id ON public.tweet_media(post_id);
CREATE INDEX IF NOT EXISTS idx_tweet_hashtags_post_id ON public.tweet_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_tweet_mentions_post_id ON public.tweet_mentions(post_id);
CREATE INDEX IF NOT EXISTS idx_tweet_urls_post_id ON public.tweet_urls(post_id);
CREATE INDEX IF NOT EXISTS idx_import_logs_user_id ON public.import_logs(user_id);

-- RLS Policies
ALTER TABLE public.twitter_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tweet_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tweet_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tweet_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tweet_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Twitter authors can be viewed by anyone (public data)
CREATE POLICY "Anyone can view twitter authors" ON public.twitter_authors
  FOR SELECT TO authenticated USING (true);

-- Media, hashtags, mentions, urls can be viewed by users who own the related posts
CREATE POLICY "Users can view media for their posts" ON public.tweet_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = tweet_media.post_id 
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view hashtags for their posts" ON public.tweet_hashtags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = tweet_hashtags.post_id 
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view mentions for their posts" ON public.tweet_mentions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = tweet_mentions.post_id 
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view urls for their posts" ON public.tweet_urls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = tweet_urls.post_id 
      AND posts.user_id = auth.uid()
    )
  );

-- Import logs are private to each user
CREATE POLICY "Users can view their own import logs" ON public.import_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own import logs" ON public.import_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Database function to get complete tweet data
CREATE OR REPLACE FUNCTION get_complete_tweet_data(tweet_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'post', row_to_json(p),
    'author', row_to_json(ta),
    'media', COALESCE(media_array.media, '[]'::json),
    'hashtags', COALESCE(hashtag_array.hashtags, '[]'::json),
    'mentions', COALESCE(mention_array.mentions, '[]'::json),
    'urls', COALESCE(url_array.urls, '[]'::json)
  ) INTO result
  FROM posts p
  LEFT JOIN twitter_authors ta ON p.twitter_author_id = ta.id
  LEFT JOIN (
    SELECT post_id, json_agg(tm) as media
    FROM tweet_media tm
    WHERE post_id = tweet_id
    GROUP BY post_id
  ) media_array ON p.id = media_array.post_id
  LEFT JOIN (
    SELECT post_id, json_agg(th) as hashtags
    FROM tweet_hashtags th
    WHERE post_id = tweet_id
    GROUP BY post_id
  ) hashtag_array ON p.id = hashtag_array.post_id
  LEFT JOIN (
    SELECT post_id, json_agg(tm) as mentions
    FROM tweet_mentions tm
    WHERE post_id = tweet_id
    GROUP BY post_id
  ) mention_array ON p.id = mention_array.post_id
  LEFT JOIN (
    SELECT post_id, json_agg(tu) as urls
    FROM tweet_urls tu
    WHERE post_id = tweet_id
    GROUP BY post_id
  ) url_array ON p.id = url_array.post_id
  WHERE p.id = tweet_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update tweet metrics
CREATE OR REPLACE FUNCTION update_tweet_metrics(
  tweet_id UUID,
  new_metrics JSONB
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE posts 
  SET 
    public_metrics = new_metrics,
    updated_at = now()
  WHERE id = tweet_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
