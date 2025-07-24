
import React, { useState } from 'react';
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  const [isLiked, setIsLiked] = useState(false);
  const [isRetweeted, setIsRetweeted] = useState(false);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isVideo = (url: string) => {
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || url.includes('video');
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleRetweet = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRetweeted(!isRetweeted);
  };

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Handle reply functionality
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Handle share functionality
  };

  return (
    <article className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer">
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.author_avatar} alt={post.author_name} />
            <AvatarFallback className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium">
              {post.author_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center space-x-1 mb-1">
            <span className="font-bold text-gray-900 dark:text-white text-[15px] hover:underline cursor-pointer">
              {post.author_name}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-[15px]">
              @{post.author_username}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-[15px]">·</span>
            <span className="text-gray-500 dark:text-gray-400 text-[15px] hover:underline cursor-pointer">
              {formatDate(post.created_at)}
            </span>
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-auto w-auto rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tweet Content */}
          <div className="text-gray-900 dark:text-white text-[15px] leading-5 mb-3 whitespace-pre-wrap">
            {post.content}
          </div>

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mb-3">
              {post.media_urls.length === 1 ? (
                <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 max-w-full">
                  {isVideo(post.media_urls[0]) ? (
                    <video
                      src={post.media_urls[0]}
                      className="w-full max-h-[512px] object-cover bg-black"
                      controls
                      preload="metadata"
                      playsInline
                      muted
                      poster=""
                    />
                  ) : (
                    <img
                      src={post.media_urls[0]}
                      alt="Tweet image"
                      className="w-full max-h-[512px] object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
              ) : (
                <div className={`grid gap-0.5 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 ${
                  post.media_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
                }`}>
                  {post.media_urls.slice(0, 4).map((url, index) => (
                    <div key={index} className="relative aspect-square">
                      {isVideo(url) ? (
                        <video
                          src={url}
                          className="w-full h-full object-cover"
                          preload="metadata"
                          playsInline
                          muted
                          controls
                        />
                      ) : (
                        <img
                          src={url}
                          alt={`Tweet image ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                      {post.media_urls!.length > 4 && index === 3 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white text-xl font-semibold">
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

          {/* Engagement Actions */}
          <div className="flex items-center justify-between max-w-md mt-1 -ml-2">
            {/* Reply */}
            <div className="flex items-center group">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReply}
                className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"
              >
                <MessageCircle className="h-[18px] w-[18px]" />
              </Button>
              {post.replies_count !== undefined && post.replies_count > 0 && (
                <span className="text-[13px] text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 ml-1">
                  {formatNumber(post.replies_count)}
                </span>
              )}
            </div>

            {/* Retweet */}
            <div className="flex items-center group">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRetweet}
                className={`p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors ${
                  isRetweeted 
                    ? 'text-green-500 dark:text-green-400' 
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-green-500 dark:group-hover:text-green-400'
                }`}
              >
                <Repeat2 className="h-[18px] w-[18px]" />
              </Button>
              {post.retweets_count !== undefined && post.retweets_count > 0 && (
                <span className={`text-[13px] ml-1 transition-colors ${
                  isRetweeted 
                    ? 'text-green-500 dark:text-green-400' 
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-green-500 dark:group-hover:text-green-400'
                }`}>
                  {formatNumber(post.retweets_count)}
                </span>
              )}
            </div>

            {/* Like */}
            <div className="flex items-center group">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
                  isLiked 
                    ? 'text-red-500 dark:text-red-400' 
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-red-500 dark:group-hover:text-red-400'
                }`}
              >
                <Heart className={`h-[18px] w-[18px] ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              {post.likes_count !== undefined && post.likes_count > 0 && (
                <span className={`text-[13px] ml-1 transition-colors ${
                  isLiked 
                    ? 'text-red-500 dark:text-red-400' 
                    : 'text-gray-500 dark:text-gray-400 group-hover:text-red-500 dark:group-hover:text-red-400'
                }`}>
                  {formatNumber(post.likes_count)}
                </span>
              )}
            </div>

            {/* Share */}
            <div className="flex items-center group">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"
              >
                <Share className="h-[18px] w-[18px]" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
