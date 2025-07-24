import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Hash, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TweetCard } from '@/components/posts/TweetCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const CollectionDetail = () => {
  const { collectionId, type } = useParams<{ collectionId: string; type: 'topic' | 'collection' }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch collection/topic info and posts
  const { data: collectionData, isLoading } = useQuery({
    queryKey: ['collection-detail', collectionId, type, user?.id],
    queryFn: async () => {
      if (!user?.id || !collectionId) return null;

      if (type === 'topic') {
        // Fetch topic info and posts
        const { data: topicData, error: topicError } = await supabase
          .from('topics')
          .select('*')
          .eq('id', collectionId)
          .single();

        if (topicError) throw topicError;

        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            post_topics!inner(
              topics(id, name, color)
            )
          `)
          .eq('user_id', user.id)
          .eq('post_topics.topic_id', collectionId)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        return {
          info: topicData,
          posts: posts || [],
          type: 'topic'
        };
      } else {
        // Fetch collection info and posts
        const { data: collectionInfo, error: collectionError } = await supabase
          .from('collections')
          .select('*')
          .eq('id', collectionId)
          .eq('user_id', user.id)
          .single();

        if (collectionError) throw collectionError;

        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            collection_posts!inner(
              collection_id
            ),
            post_topics(
              topics(id, name, color)
            )
          `)
          .eq('user_id', user.id)
          .eq('collection_posts.collection_id', collectionId)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        return {
          info: collectionInfo,
          posts: posts || [],
          type: 'collection'
        };
      }
    },
    enabled: !!user?.id && !!collectionId && !!type,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 z-10">
          <div className="flex items-center p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/collections')}
              className="mr-3 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-6 bg-slate-700 rounded w-32 animate-pulse" />
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-slate-700 rounded mb-3" />
              <div className="h-3 bg-slate-700 rounded w-2/3 mb-3" />
              <div className="h-3 bg-slate-700 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!collectionData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Collection not found</h2>
          <p className="text-slate-400 mb-4">This collection may have been removed or you don't have access to it.</p>
          <Button onClick={() => navigate('/collections')}>
            Back to Collections
          </Button>
        </div>
      </div>
    );
  }

  const { info, posts, type: collectionType } = collectionData;

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center flex-1 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/collections')}
              className="mr-3 text-slate-400 hover:text-white shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                {collectionType === 'topic' ? (
                  <Hash className="h-5 w-5 text-blue-400" />
                ) : (
                  <FolderOpen className="h-5 w-5 text-blue-400" />
                )}
              </div>
              
              {collectionType === 'topic' && (info as any).color && (
                <div 
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: (info as any).color }}
                />
              )}
              
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-white truncate">{info.name}</h1>
                {info.description && (
                  <p className="text-sm text-slate-400 truncate">{info.description}</p>
                )}
              </div>
            </div>
          </div>
          
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 shrink-0 ml-3">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </Badge>
        </div>
      </div>

      {/* Posts */}
      <div className="p-4">
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <TweetCard 
                key={post.id} 
                post={post} 
                onDelete={() => window.location.reload()} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mb-6">
              {collectionType === 'topic' ? (
                <Hash className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              ) : (
                <FolderOpen className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              )}
              <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                {collectionType === 'topic' 
                  ? "No posts have been classified with this topic yet. Import more posts to see them here."
                  : "This collection is empty. Start adding posts to build your collection."
                }
              </p>
            </div>
            
            <Button 
              onClick={() => navigate('/profile')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Import More Posts
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionDetail;