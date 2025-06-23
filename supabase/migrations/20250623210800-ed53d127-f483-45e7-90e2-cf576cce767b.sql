
-- Create posts table to store X posts
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  x_post_id TEXT UNIQUE, -- Original X post ID for deduplication
  author_name TEXT NOT NULL,
  author_username TEXT NOT NULL,
  author_avatar TEXT,
  content TEXT NOT NULL,
  media_urls TEXT[], -- Array of media URLs
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  saved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  likes_count INTEGER DEFAULT 0,
  retweets_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  x_url TEXT -- Link back to original X post
);

-- Create topics table for AI-generated topic clusters
CREATE TABLE public.topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6', -- Hex color for UI
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_topics junction table for many-to-many relationship
CREATE TABLE public.post_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES public.topics ON DELETE CASCADE NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.8, -- AI confidence in topic assignment
  is_manual BOOLEAN DEFAULT FALSE, -- Whether user manually assigned this topic
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, topic_id)
);

-- Create collections table for user-organized post groups
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collection_posts junction table
CREATE TABLE public.collection_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID REFERENCES public.collections ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collection_id, post_id)
);

-- Create user_follows table to track followed X accounts
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  x_username TEXT NOT NULL,
  x_user_id TEXT,
  display_name TEXT,
  avatar_url TEXT,
  followed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, x_username)
);

-- Enable RLS on all tables
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
CREATE POLICY "Users can view their own posts" ON public.posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for topics (public read, admin write)
CREATE POLICY "Anyone can view topics" ON public.topics
  FOR SELECT TO authenticated USING (true);

-- RLS Policies for post_topics
CREATE POLICY "Users can view their post topics" ON public.post_topics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_topics.post_id 
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their post topics" ON public.post_topics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_topics.post_id 
      AND posts.user_id = auth.uid()
    )
  );

-- RLS Policies for collections
CREATE POLICY "Users can view their own collections" ON public.collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own collections" ON public.collections
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for collection_posts
CREATE POLICY "Users can view their collection posts" ON public.collection_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.collections 
      WHERE collections.id = collection_posts.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their collection posts" ON public.collection_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.collections 
      WHERE collections.id = collection_posts.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

-- RLS Policies for user_follows
CREATE POLICY "Users can view their own follows" ON public.user_follows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own follows" ON public.user_follows
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_x_post_id ON public.posts(x_post_id);
CREATE INDEX idx_post_topics_post_id ON public.post_topics(post_id);
CREATE INDEX idx_post_topics_topic_id ON public.post_topics(topic_id);
CREATE INDEX idx_collections_user_id ON public.collections(user_id);
CREATE INDEX idx_user_follows_user_id ON public.user_follows(user_id);

-- Insert some default topics
INSERT INTO public.topics (name, description, color) VALUES
  ('Technology', 'Posts about tech, AI, software, and innovation', '#3B82F6'),
  ('Sports', 'Sports news, stats, and discussions', '#EF4444'),
  ('Art & Design', 'Creative content, visual arts, and design', '#8B5CF6'),
  ('Business', 'Business news, entrepreneurship, and finance', '#10B981'),
  ('Science', 'Scientific discoveries and research', '#F59E0B'),
  ('Politics', 'Political news and discussions', '#6B7280'),
  ('Entertainment', 'Movies, music, TV, and celebrity news', '#EC4899'),
  ('Health', 'Health, fitness, and wellness content', '#14B8A6'),
  ('Education', 'Learning resources and educational content', '#F97316'),
  ('Travel', 'Travel experiences and destinations', '#06B6D4');
