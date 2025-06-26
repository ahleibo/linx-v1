
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FolderOpen, Hash, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface Collection {
  id: string;
  name: string;
  description: string;
  post_count: number;
  updated_at: string;
  created_at: string;
}

const Collections = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['all-collections', user?.id],
    queryFn: async (): Promise<Collection[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('collections')
        .select(`
          id,
          name,
          description,
          created_at,
          updated_at,
          collection_posts(count)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return data.map(collection => ({
        ...collection,
        post_count: collection.collection_posts?.[0]?.count || 0
      }));
    },
    enabled: !!user?.id,
  });

  // Generate AI-based topic collections if no manual collections exist
  const { data: topicCollections = [] } = useQuery({
    queryKey: ['all-topic-collections', user?.id],
    queryFn: async () => {
      if (!user?.id || collections.length > 0) return [];

      const { data } = await supabase
        .from('topics')
        .select(`
          id,
          name,
          description,
          color,
          created_at,
          post_topics(
            posts(id)
          )
        `)
        .order('name');

      return data?.map(topic => ({
        id: topic.id,
        name: topic.name,
        description: topic.description,
        color: topic.color,
        created_at: topic.created_at,
        updated_at: topic.created_at,
        post_count: topic.post_topics?.length || 0
      })) || [];
    },
    enabled: !!user?.id && collections.length === 0,
  });

  const displayCollections = collections.length > 0 ? collections : topicCollections;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white pb-20">
        <div className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 z-10">
          <div className="flex items-center p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile')}
              className="mr-3 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Collections</h1>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-slate-800/30 border-slate-700 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-slate-700 rounded mb-3" />
                  <div className="h-3 bg-slate-700 rounded w-2/3 mb-3" />
                  <div className="h-3 bg-slate-700 rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile')}
              className="mr-3 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">All Collections</h1>
          </div>
          
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
            {displayCollections.length} {displayCollections.length === 1 ? 'collection' : 'collections'}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Collections Grid */}
        {displayCollections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayCollections.map((collection) => (
              <Card 
                key={collection.id} 
                className="bg-slate-800/30 border-slate-700 hover:bg-slate-800/50 transition-all duration-200 cursor-pointer group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {collections.length > 0 ? (
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <FolderOpen className="h-5 w-5 text-blue-400" />
                        </div>
                      ) : (
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                          <Hash className="h-5 w-5 text-blue-400" />
                        </div>
                      )}
                      {(collection as any).color && (
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ 
                            backgroundColor: (collection as any).color 
                          }}
                        />
                      )}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="bg-slate-700/50 text-slate-300"
                    >
                      {collection.post_count} posts
                    </Badge>
                  </div>
                  
                  <CardTitle className="text-white text-lg group-hover:text-blue-400 transition-colors">
                    {collection.name}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {collection.description && (
                    <p className="text-sm text-slate-400 mb-4 line-clamp-3">
                      {collection.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {collections.length > 0 ? 'Collection' : 'AI Topic'}
                    </span>
                    <span>
                      Updated {formatDate(collection.updated_at)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="mb-6">
              <FolderOpen className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No collections yet</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Start saving posts to automatically create collections, or create your first custom collection.
              </p>
            </div>
            
            <Button 
              onClick={() => navigate('/profile')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Import Your First Post
            </Button>
          </div>
        )}

        {/* Summary Stats */}
        {displayCollections.length > 0 && (
          <Card className="bg-slate-800/20 border-slate-700">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    {displayCollections.length}
                  </div>
                  <div className="text-sm text-slate-400">Total Collections</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {displayCollections.reduce((sum, col) => sum + col.post_count, 0)}
                  </div>
                  <div className="text-sm text-slate-400">Total Posts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    {Math.round(displayCollections.reduce((sum, col) => sum + col.post_count, 0) / displayCollections.length) || 0}
                  </div>
                  <div className="text-sm text-slate-400">Avg per Collection</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-400">
                    {collections.length > 0 ? 'Manual' : 'AI Generated'}
                  </div>
                  <div className="text-sm text-slate-400">Collection Type</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Collections;
