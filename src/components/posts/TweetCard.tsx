
import React, { useState } from 'react';
import { Heart, MessageCircle, Repeat2, Bookmark, ExternalLink, Play } from 'lucide-react';
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
  const [expandedMedia, setExpandedMedia] = useState<string | null>(null);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'now';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isVideo = (url: string) => {
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || url.includes('video');
  };

  return (
    <Card className="border-0 border-b border-slate-800 rounded-none bg-transparent hover:bg-slate-900/30 transition-colors cursor-pointer">
      <CardContent className="p-4">
        <div className="flex space-x-3">
          {/* Avatar */}
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage src={post.author_avatar} alt={post.author_name} />
            <AvatarFallback className="bg-slate-600 text-white text-sm">
              {post.author_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-bold text-white text-sm">{post.author_name}</span>
              <span className="text-slate-500 text-sm">@{post.author_username}</span>
              <span className="text-slate-500 text-sm">·</span>
              <span className="text-slate-500 text-sm">{formatDate(post.created_at)}</span>
              {post.x_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="ml-auto text-slate-500 hover:text-slate-300 p-1 h-auto"
                >
                  <a href={post.x_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>

            {/* Content */}
            <div className="text-white text-sm leading-normal mb-3 whitespace-pre-wrap">
              {post.content}
            </div>

            {/* Media */}
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="mb-3">
                {post.media_urls.length === 1 ? (
                  <div className="rounded-2xl overflow-hidden border border-slate-700 max-w-full">
                    {isVideo(post.media_urls[0]) ? (
                      <div className="relative bg-black">
                        <video
                          src={post.media_urls[0]}
                          className="w-full max-h-80 object-contain"
                          controls
                          preload="metadata"
                        />
                      </div>
                    ) : (
                      <img
                        src={post.media_urls[0]}
                        alt="Post image"
                        className="w-full max-h-80 object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                ) : (
                  <div className={`grid gap-0.5 rounded-2xl overflow-hidden border border-slate-700 ${
                    post.media_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
                  }`}>
                    {post.media_urls.slice(0, 4).map((url, index) => (
                      <div key={index} className="relative aspect-square bg-slate-800">
                        {isVideo(url) ? (
                          <div className="relative w-full h-full bg-black">
                            <video
                              src={url}
                              className="w-full h-full object-cover"
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-black/50 rounded-full p-2">
                                <Play className="h-4 w-4 text-white" fill="white" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={url}
                            alt={`Image ${index + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                        {post.media_urls!.length > 4 && index === 3 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white font-semibold">
                              +{post.media_urls!.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Topics */}
            {post.post_topics && post.post_topics.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {post.post_topics.slice(0, 3).map((topicRel, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border-0"
                  >
                    {topicRel.topics.name}
                  </Badge>
                ))}
                {post.post_topics.length > 3 && (
                  <Badge className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border-0">
                    +{post.post_topics.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between max-w-md mt-2">
              <div className="flex items-center space-x-1 text-slate-500 hover:text-blue-400 transition-colors group">
                <Button variant="ghost" size="sm" className="p-2 h-8 w-8 rounded-full group-hover:bg-blue-500/10">
                  <MessageCircle className="h-4 w-4" />
                </Button>
                {post.replies_count !== undefined && (
                  <span className="text-xs">{formatNumber(post.replies_count)}</span>
                )}
              </div>

              <div className="flex items-center space-x-1 text-slate-500 hover:text-green-400 transition-colors group">
                <Button variant="ghost" size="sm" className="p-2 h-8 w-8 rounded-full group-hover:bg-green-500/10">
                  <Repeat2 className="h-4 w-4" />
                </Button>
                {post.retweets_count !== undefined && (
                  <span className="text-xs">{formatNumber(post.retweets_count)}</span>
                )}
              </div>

              <div className="flex items-center space-x-1 text-slate-500 hover:text-red-400 transition-colors group">
                <Button variant="ghost" size="sm" className="p-2 h-8 w-8 rounded-full group-hover:bg-red-500/10">
                  <Heart className="h-4 w-4" />
                </Button>
                {post.likes_count !== undefined && (
                  <span className="text-xs">{formatNumber(post.likes_count)}</span>
                )}
              </div>

              <div className="flex items-center space-x-1 text-slate-500 hover:text-blue-400 transition-colors group">
                <Button variant="ghost" size="sm" className="p-2 h-8 w-8 rounded-full group-hover:bg-blue-500/10">
                  <Bookmark className="h-4 w-4" />
                </Button>
                {post.bookmark_count !== undefined && post.bookmark_count > 0 && (
                  <span className="text-xs">{formatNumber(post.bookmark_count)}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
