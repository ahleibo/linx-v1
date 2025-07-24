import React, { useState } from 'react';
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  onDelete?: (postId: string) => void;
}

export const TweetCard = ({ post, onDelete }: TweetCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isRetweeted, setIsRetweeted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

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
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || 
           url.includes('video') || 
           url.includes('mp4') ||
           url.includes('twitter.com') ||
           url.includes('t.co');
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
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;

      toast({
        title: "Post deleted",
        description: "The post has been successfully deleted.",
      });

      onDelete?.(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete the post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="bg-card border border-border rounded-xl p-4 mb-4 hover:bg-accent/30 transition-all duration-200">
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.author_avatar} alt={post.author_name} />
            <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
              {post.author_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center space-x-1 mb-2">
            <span className="font-bold text-card-foreground text-[15px] hover:underline cursor-pointer">
              {post.author_name}
            </span>
            <span className="text-muted-foreground text-[15px]">
              @{post.author_username}
            </span>
            <span className="text-muted-foreground text-[15px]">·</span>
            <span className="text-muted-foreground text-[15px] hover:underline cursor-pointer">
              {formatDate(post.created_at)}
            </span>
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-auto w-auto rounded-full hover:bg-accent text-muted-foreground hover:text-card-foreground"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-card border-border text-card-foreground">
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="focus:bg-destructive/20 text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeleting ? "Deleting..." : "Delete post"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Tweet Content */}
          <div className="text-card-foreground text-[15px] leading-5 mb-3 whitespace-pre-wrap">
            {post.content}
          </div>

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mb-3">
              {post.media_urls.length === 1 ? (
                <div className="rounded-2xl overflow-hidden border border-border max-w-full">
                  {isVideo(post.media_urls[0]) ? (
                    <>
                      {(post.media_urls[0].includes('twitter.com') || post.media_urls[0].includes('t.co')) ? (
                        <div className="w-full h-[400px] bg-muted flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <div className="text-lg mb-2">🎥</div>
                            <p className="text-sm">Video from {post.author_name}</p>
                            <a 
                              href={post.x_url || post.media_urls[0]} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 text-xs mt-1 block"
                            >
                              View on X/Twitter
                            </a>
                          </div>
                        </div>
                      ) : (
                        <video
                          key={post.media_urls[0]}
                          className="w-full max-h-[512px] object-cover bg-muted"
                          controls
                          preload="auto"
                          playsInline
                          crossOrigin="anonymous"
                        >
                          <source src={post.media_urls[0]} type="video/mp4" />
                          <source src={post.media_urls[0]} type="video/webm" />
                          <source src={post.media_urls[0]} type="video/ogg" />
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </>
                  ) : (
                    <img
                      src={post.media_urls[0]}
                      alt="Post image"
                      className="w-full max-h-[512px] object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
              ) : (
                <div className={`grid gap-0.5 rounded-2xl overflow-hidden border border-border ${
                  post.media_urls.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
                }`}>
                  {post.media_urls.slice(0, 4).map((url, index) => (
                    <div key={index} className="relative aspect-square">
                      {isVideo(url) ? (
                        <video
                          key={url}
                          className="w-full h-full object-cover bg-muted"
                          preload="auto"
                          playsInline
                          controls
                        >
                          <source src={url} type="video/mp4" />
                          <source src={url} type="video/webm" />
                          <source src={url} type="video/ogg" />
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <img
                          src={url}
                          alt={`Post image ${index + 1}`}
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
          <div className="flex items-center justify-between max-w-md mt-2">
            {/* Reply */}
            <div className="flex items-center group">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReply}
                className="p-2 rounded-full hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-colors"
              >
                <MessageCircle className="h-[18px] w-[18px]" />
              </Button>
              {post.replies_count !== undefined && post.replies_count > 0 && (
                <span className="text-[13px] text-muted-foreground group-hover:text-primary ml-1">
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
                className={`p-2 rounded-full hover:bg-emerald-500/10 transition-colors ${
                  isRetweeted 
                    ? 'text-emerald-500' 
                    : 'text-muted-foreground group-hover:text-emerald-500'
                }`}
              >
                <Repeat2 className="h-[18px] w-[18px]" />
              </Button>
              {post.retweets_count !== undefined && post.retweets_count > 0 && (
                <span className={`text-[13px] ml-1 transition-colors ${
                  isRetweeted 
                    ? 'text-emerald-500' 
                    : 'text-muted-foreground group-hover:text-emerald-500'
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
                className={`p-2 rounded-full hover:bg-red-500/10 transition-colors ${
                  isLiked 
                    ? 'text-red-500' 
                    : 'text-muted-foreground group-hover:text-red-500'
                }`}
              >
                <Heart className={`h-[18px] w-[18px] ${isLiked ? 'fill-current' : ''}`} />
              </Button>
              {post.likes_count !== undefined && post.likes_count > 0 && (
                <span className={`text-[13px] ml-1 transition-colors ${
                  isLiked 
                    ? 'text-red-500' 
                    : 'text-muted-foreground group-hover:text-red-500'
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
                className="p-2 rounded-full hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-colors"
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