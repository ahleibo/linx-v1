
-- Enable RLS on all tables if not already enabled
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS policies for posts table
CREATE POLICY "Users can view their own posts" ON public.posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS policies for post_topics table
CREATE POLICY "Users can view topics for their posts" ON public.post_topics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_topics.post_id 
      AND posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert topics for their posts" ON public.post_topics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE posts.id = post_topics.post_id 
      AND posts.user_id = auth.uid()
    )
  );

-- RLS policies for collections table
CREATE POLICY "Users can view their own collections" ON public.collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collections" ON public.collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" ON public.collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" ON public.collections
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for collection_posts table
CREATE POLICY "Users can view posts in their collections" ON public.collection_posts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.collections 
      WHERE collections.id = collection_posts.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add posts to their collections" ON public.collection_posts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections 
      WHERE collections.id = collection_posts.collection_id 
      AND collections.user_id = auth.uid()
    )
  );

-- RLS policies for user_follows table
CREATE POLICY "Users can view their own follows" ON public.user_follows
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own follows" ON public.user_follows
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own follows" ON public.user_follows
  FOR DELETE USING (auth.uid() = user_id);

-- Allow public read access to topics table (no user-specific data)
CREATE POLICY "Anyone can view topics" ON public.topics
  FOR SELECT TO authenticated USING (true);
