
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TweetCard } from '@/components/posts/TweetCard';

interface Post {
  id: string;
  content: string;
  author_name: string;
  author_username: string;
  author_avatar?: string;
  created_at: string;
  likes_count?: number;
  retweets_count?: number;
  replies_count?: number;
  x_url?: string;
  media_urls?: string[];
  post_topics?: Array<{
    topics: {
      id: string;
      name: string;
      color: string;
    };
  }>;
}

interface PostSearchResultsProps {
  query: string;
  results: Post[];
  isLoading: boolean;
}

export const PostSearchResults: React.FC<PostSearchResultsProps> = ({
  query,
  results,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-slate-400">Searching "{query}"...</div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 animate-pulse">
            <div className="flex space-x-3">
              <div className="w-10 h-10 bg-slate-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-700 rounded w-1/3" />
                <div className="h-3 bg-slate-700 rounded w-full" />
                <div className="h-3 bg-slate-700 rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0 && query) {
    return (
      <div className="text-center py-6">
        <div className="text-slate-400 mb-2">No posts found for "{query}"</div>
        <p className="text-sm text-slate-500">
          Try searching with different keywords or topics
        </p>
      </div>
    );
  }

  if (results.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          Found {results.length} posts for "{query}"
        </div>
        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
          {results.length} results
        </Badge>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {results.map((post) => (
          <TweetCard 
            key={post.id} 
            post={post} 
            onDelete={() => window.location.reload()} 
          />
        ))}
      </div>
    </div>
  );
};
