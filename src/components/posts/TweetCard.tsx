
import React from 'react';
import { Heart, MessageCircle, Repeat2, Bookmark, ExternalLink, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TweetCardProps {
  post: {
    id: string;
    content: string;
    author_name: string;
    author_username: string;
    author_avatar?: string;
    media_urls?: string[];
    likes_count?: number;
    retweets_count?: number;
    replies_count?: number;
    bookmark_count?: number;
    created_at: string;
    x_url?: string;
    post_topics?: Array<{
      topics: {
        id: string;
        name: string;
        color: string;
      };
    }>;
  };
}

export const TweetCard = ({ post }: TweetCardProps) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card className="bg-slate-800/30 border-slate-700 hover:bg-slate-800/50 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Author Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={post.author_avatar} />
                <AvatarFallback className="bg-slate-600 text-white text-sm">
                  {post.author_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-white text-sm truncate">
                    {post.author_name}
                  </span>
                  <span className="text-slate-400 text-sm">
                    @{post.author_username}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-slate-500">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </div>
            </div>

            {post.x_url && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-slate-400 hover:text-blue-400 p-1"
              >
                <a
                  href={post.x_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="space-y-2">
              {post.media_urls.length === 1 ? (
                <div className="rounded-lg overflow-hidden border border-slate-600">
                  <img
                    src={post.media_urls[0]}
                    alt="Post media"
                    className="w-full h-auto max-h-96 object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {post.media_urls.slice(0, 4).map((url, index) => (
                    <div key={index} className="rounded-lg overflow-hidden border border-slate-600">
                      <img
                        src={url}
                        alt={`Post media ${index + 1}`}
                        className="w-full h-32 object-cover"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Topics */}
          {post.post_topics && post.post_topics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.post_topics.slice(0, 3).map((topicRel, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: `${topicRel.topics.color}20`,
                    color: topicRel.topics.color,
                    borderColor: `${topicRel.topics.color}40`
                  }}
                >
                  {topicRel.topics.name}
                </Badge>
              ))}
              {post.post_topics.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-300">
                  +{post.post_topics.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Engagement Metrics */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <div className="flex items-center space-x-4 text-slate-400">
              {post.replies_count !== undefined && (
                <div className="flex items-center space-x-1 text-xs">
                  <MessageCircle className="h-4 w-4" />
                  <span>{formatNumber(post.replies_count)}</span>
                </div>
              )}
              
              {post.retweets_count !== undefined && (
                <div className="flex items-center space-x-1 text-xs">
                  <Repeat2 className="h-4 w-4" />
                  <span>{formatNumber(post.retweets_count)}</span>
                </div>
              )}
              
              {post.likes_count !== undefined && (
                <div className="flex items-center space-x-1 text-xs">
                  <Heart className="h-4 w-4" />
                  <span>{formatNumber(post.likes_count)}</span>
                </div>
              )}

              {post.bookmark_count !== undefined && post.bookmark_count > 0 && (
                <div className="flex items-center space-x-1 text-xs">
                  <Bookmark className="h-4 w-4" />
                  <span>{formatNumber(post.bookmark_count)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
