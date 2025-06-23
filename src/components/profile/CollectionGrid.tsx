
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FolderOpen, Hash } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  description: string;
  post_count: number;
  updated_at: string;
}

export const CollectionGrid: React.FC = () => {
  const { user } = useAuth();

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['user-collections', user?.id],
    queryFn: async (): Promise<Collection[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('collections')
        .select(`
          id,
          name,
          description,
          updated_at,
          collection_posts(count)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(6);

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
    queryKey: ['topic-collections', user?.id],
    queryFn: async () => {
      if (!user?.id || collections.length > 0) return [];

      const { data } = await supabase
        .from('topics')
        .select(`
          id,
          name,
          description,
          color,
          post_topics(
            posts(id)
          )
        `)
        .limit(6);

      return data?.map(topic => ({
        id: topic.id,
        name: topic.name,
        description: topic.description,
        color: topic.color,
        post_count: topic.post_topics?.length || 0
      })) || [];
    },
    enabled: !!user?.id && collections.length === 0,
  });

  const displayCollections = collections.length > 0 ? collections : topicCollections;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="bg-slate-800/30 border-slate-700 animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-slate-700 rounded mb-2" />
              <div className="h-3 bg-slate-700 rounded w-2/3 mb-2" />
              <div className="h-3 bg-slate-700 rounded w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {displayCollections.map((collection) => (
        <Card 
          key={collection.id} 
          className="bg-slate-800/30 border-slate-700 hover:bg-slate-800/50 transition-all duration-200 cursor-pointer group"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                {collections.length > 0 ? (
                  <FolderOpen className="h-4 w-4 text-blue-400" />
                ) : (
                  <Hash className="h-4 w-4 text-blue-400" />
                )}
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ 
                    backgroundColor: (collection as any).color || '#3B82F6' 
                  }}
                />
              </div>
              <Badge 
                variant="secondary" 
                className="bg-slate-700/50 text-slate-300 text-xs"
              >
                {collection.post_count}
              </Badge>
            </div>
            
            <h4 className="font-semibold text-white text-sm mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
              {collection.name}
            </h4>
            
            {collection.description && (
              <p className="text-xs text-slate-400 line-clamp-2">
                {collection.description}
              </p>
            )}
            
            <div className="text-xs text-slate-500 mt-2">
              {collections.length > 0 ? 'Collection' : 'AI Topic'}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {displayCollections.length === 0 && !isLoading && (
        <div className="col-span-2 text-center py-8">
          <FolderOpen className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No collections yet</p>
          <p className="text-sm text-slate-500">Start saving posts to create collections</p>
        </div>
      )}
    </div>
  );
};
