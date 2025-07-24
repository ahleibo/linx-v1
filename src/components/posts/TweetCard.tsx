
import React, { useState, useRef } from 'react';
import { Heart, MessageCircle, Repeat2, Bookmark, ExternalLink, Calendar, Play, Pause, Volume2, VolumeX } from 'lucide-react';
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
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(new Set());
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

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

  const isVideo = (url: string) => {
    return /\.(mp4|webm|ogg|mov|avi|mkv)(\?.*)?$/i.test(url) || 
           url.includes('video') || 
           url.includes('mp4') ||
           url.includes('.mov');
  };

  const handleVideoPlay = (url: string) => {
    const video = videoRefs.current[url];
    if (!video) return;

    if (playingVideos.has(url)) {
      video.pause();
      setPlayingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
    } else {
      video.play();
      setPlayingVideos(prev => new Set(prev).add(url));
    }
  };

  const handleVideoMute = (url: string) => {
    const video = videoRefs.current[url];
    if (!video) return;

    if (mutedVideos.has(url)) {
      video.muted = false;
      setMutedVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(url);
        return newSet;
      });
    } else {
      video.muted = true;
      setMutedVideos(prev => new Set(prev).add(url));
    }
  };

  const MediaItem = ({ url, index, total, className = "" }: { 
    url: string; 
    index: number; 
    total: number; 
    className?: string;
  }) => {
    const isVideoFile = isVideo(url);
    const isPlaying = playingVideos.has(url);
    const isMuted = mutedVideos.has(url);
    
    return (
      <div className={`relative rounded-2xl overflow-hidden bg-slate-900/50 border border-slate-700/50 group hover:border-slate-600/70 transition-all duration-300 ${className}`}>
        {isVideoFile ? (
          <>
            <video
              ref={(el) => { videoRefs.current[url] = el; }}
              src={url}
              className="w-full h-full object-cover"
              preload="metadata"
              playsInline
              loop
              muted={isMuted}
              onPlay={() => setPlayingVideos(prev => new Set(prev).add(url))}
              onPause={() => setPlayingVideos(prev => {
                const newSet = new Set(prev);
                newSet.delete(url);
                return newSet;
              })}
            />
            
            {/* Video Controls Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVideoPlay(url)}
                  className="bg-black/50 hover:bg-black/70 text-white border-0 rounded-full p-2 h-auto"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVideoMute(url)}
                  className="bg-black/50 hover:bg-black/70 text-white border-0 rounded-full p-2 h-auto"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Play Button Overlay (when not playing) */}
            {!isPlaying && (
              <div 
                className="absolute inset-0 flex items-center justify-center cursor-pointer"
                onClick={() => handleVideoPlay(url)}
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-full p-4 group-hover:scale-110 transition-transform duration-200 shadow-lg">
                  <Play className="h-6 w-6 text-slate-900 ml-0.5" fill="currentColor" />
                </div>
              </div>
            )}
          </>
        ) : (
          <img
            src={url}
            alt={`Post media ${index + 1}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}
      </div>
    );
  };

  const getMediaLayout = () => {
    const mediaCount = post.media_urls?.length || 0;
    
    if (mediaCount === 0) return null;
    
    const mediaItems = post.media_urls!.slice(0, 4);
    
    if (mediaCount === 1) {
      return (
        <div className="aspect-video max-h-96">
          <MediaItem url={mediaItems[0]} index={0} total={1} className="h-full" />
        </div>
      );
    }
    
    if (mediaCount === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 aspect-video max-h-80">
          {mediaItems.map((url, index) => (
            <MediaItem key={index} url={url} index={index} total={2} className="h-full" />
          ))}
        </div>
      );
    }
    
    if (mediaCount === 3) {
      return (
        <div className="grid grid-cols-2 gap-2 aspect-video max-h-80">
          <MediaItem url={mediaItems[0]} index={0} total={3} className="h-full" />
          <div className="grid grid-rows-2 gap-2 h-full">
            <MediaItem url={mediaItems[1]} index={1} total={3} className="h-full" />
            <MediaItem url={mediaItems[2]} index={2} total={3} className="h-full" />
          </div>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-2 gap-2 aspect-video max-h-80">
        {mediaItems.map((url, index) => (
          <MediaItem key={index} url={url} index={index} total={4} className="h-full" />
        ))}
      </div>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-slate-800/40 to-slate-900/60 border-slate-700/50 hover:border-slate-600/70 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/20 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Author Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              <Avatar className="w-12 h-12 ring-2 ring-slate-700/50">
                <AvatarImage src={post.author_avatar} />
                <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-sm font-medium">
                  {post.author_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white text-base truncate">
                    {post.author_name}
                  </span>
                  <span className="text-slate-400 text-sm">
                    @{post.author_username}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
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
                className="text-slate-400 hover:text-blue-400 hover:bg-slate-800/50 rounded-full p-2 shrink-0"
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
          <div className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">
            {post.content}
          </div>

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="my-4">
              {getMediaLayout()}
            </div>
          )}

          {/* Topics */}
          {post.post_topics && post.post_topics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.post_topics.slice(0, 4).map((topicRel, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs px-3 py-1 rounded-full border-0 font-medium"
                  style={{
                    backgroundColor: `${topicRel.topics.color}15`,
                    color: topicRel.topics.color,
                  }}
                >
                  {topicRel.topics.name}
                </Badge>
              ))}
              {post.post_topics.length > 4 && (
                <Badge 
                  variant="secondary" 
                  className="text-xs px-3 py-1 rounded-full bg-slate-700/50 text-slate-300 border-0"
                >
                  +{post.post_topics.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* Engagement Metrics */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-700/30">
            <div className="flex items-center space-x-6 text-slate-400">
              {post.replies_count !== undefined && (
                <div className="flex items-center space-x-2 text-xs hover:text-blue-400 transition-colors cursor-pointer">
                  <MessageCircle className="h-4 w-4" />
                  <span className="font-medium">{formatNumber(post.replies_count)}</span>
                </div>
              )}
              
              {post.retweets_count !== undefined && (
                <div className="flex items-center space-x-2 text-xs hover:text-green-400 transition-colors cursor-pointer">
                  <Repeat2 className="h-4 w-4" />
                  <span className="font-medium">{formatNumber(post.retweets_count)}</span>
                </div>
              )}
              
              {post.likes_count !== undefined && (
                <div className="flex items-center space-x-2 text-xs hover:text-red-400 transition-colors cursor-pointer">
                  <Heart className="h-4 w-4" />
                  <span className="font-medium">{formatNumber(post.likes_count)}</span>
                </div>
              )}

              {post.bookmark_count !== undefined && post.bookmark_count > 0 && (
                <div className="flex items-center space-x-2 text-xs hover:text-yellow-400 transition-colors cursor-pointer">
                  <Bookmark className="h-4 w-4" />
                  <span className="font-medium">{formatNumber(post.bookmark_count)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
