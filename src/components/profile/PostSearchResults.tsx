
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Heart, Repeat2, ExternalLink } from 'lucide-react';

interface Post {
  id: string;
  content: string;
  author_name: string;
  author_username: string;
  author_avatar?: string;
  created_at: string;
  likes_count: number;
  retweets_count: number;
  replies_count: number;
  x_url?: string;
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
          <Card key={i} className="bg-slate-800/30 border-slate-700 animate-pulse">
            <CardContent className="p-4">
              <div className="flex space-x-3">
                <div className="w-10 h-10 bg-slate-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-700 rounded w-full" />
                  <div className="h-3 bg-slate-700 rounded w-2/3" />
                </div>
              </div>
            </CardContent>
          </Card>
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
          <Card key={post.id} className="bg-slate-800/30 border-slate-700 hover:bg-slate-800/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={post.author_avatar} />
                  <AvatarFallback className="bg-slate-600 text-white text-sm">
                    {post.author_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-white text-sm">
                      {post.author_name}
                    </span>
                    <span className="text-slate-400 text-sm">
                      @{post.author_username}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-slate-200 text-sm mb-3 line-clamp-3">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-slate-400">
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-xs">{post.replies_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Repeat2 className="h-4 w-4" />
                        <span className="text-xs">{post.retweets_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="h-4 w-4" />
                        <span className="text-xs">{post.likes_count}</span>
                      </div>
                    </div>

                    {post.x_url && (
                      <a
                        href={post.x_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
