
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Repeat2, Share, X, ShieldCheck } from 'lucide-react';
import { EnhancedXPostData } from '@/types/twitter';

interface EnhancedTweetCardProps {
  post: EnhancedXPostData;
  onRemove?: () => void;
  showRemoveButton?: boolean;
  className?: string;
}

export const EnhancedTweetCard = ({ 
  post, 
  onRemove, 
  showRemoveButton = false,
  className = "" 
}: EnhancedTweetCardProps) => {
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    } catch (error) {
      return 'Recently';
    }
  };

  const getVerificationIcon = () => {
    if (!post.authorVerified) return null;
    
    const iconClass = "w-4 h-4 ml-1";
    switch (post.authorVerifiedType) {
      case 'blue':
        return <ShieldCheck className={`${iconClass} text-blue-500`} />;
      case 'business':
        return <ShieldCheck className={`${iconClass} text-yellow-500`} />;
      case 'government':
        return <ShieldCheck className={`${iconClass} text-gray-500`} />;
      default:
        return <ShieldCheck className={`${iconClass} text-blue-500`} />;
    }
  };

  const renderMedia = () => {
    if (!post.media || post.media.length === 0) {
      // Check for legacy mediaUrls
      if (post.mediaUrls && post.mediaUrls.length > 0) {
        return (
          <div className="mt-3 rounded-2xl overflow-hidden">
            {post.mediaUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Media ${index + 1}`}
                className="w-full max-h-96 object-cover"
              />
            ))}
          </div>
        );
      }
      return null;
    }

    return (
      <div className="mt-3 rounded-2xl overflow-hidden">
        {post.media.length === 1 ? (
          <div className="relative">
            {post.media[0].type === 'photo' ? (
              <img
                src={post.media[0].url}
                alt={post.media[0].alt_text || 'Tweet image'}
                className="w-full max-h-96 object-cover"
              />
            ) : (
              <div className="relative bg-black">
                <img
                  src={post.media[0].preview_image_url}
                  alt="Video thumbnail"
                  className="w-full max-h-96 object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[12px] border-l-black border-y-[8px] border-y-transparent ml-1" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1">
            {post.media.slice(0, 4).map((media, index) => (
              <div key={media.media_key || index} className="relative aspect-square">
                <img
                  src={media.type === 'photo' ? media.url : media.preview_image_url}
                  alt={media.alt_text || `Media ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {media.type !== 'photo' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[6px] border-l-black border-y-[4px] border-y-transparent ml-0.5" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderEngagementMetrics = () => (
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800 text-gray-500">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-1 hover:text-red-500 cursor-pointer transition-colors">
          <Heart className="w-4 h-4" />
          <span className="text-sm">{formatNumber(post.likesCount || 0)}</span>
        </div>
        
        <div className="flex items-center space-x-1 hover:text-green-500 cursor-pointer transition-colors">
          <Repeat2 className="w-4 h-4" />
          <span className="text-sm">{formatNumber(post.retweetsCount || 0)}</span>
        </div>
        
        <div className="flex items-center space-x-1 hover:text-blue-500 cursor-pointer transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span className="text-sm">{formatNumber(post.repliesCount || 0)}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Share className="w-4 h-4 hover:text-blue-500 cursor-pointer transition-colors" />
      </div>
    </div>
  );

  return (
    <Card className={`bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="w-12 h-12 flex-shrink-0">
            <AvatarImage 
              src={post.authorAvatar} 
              alt={`@${post.authorUsername}`} 
            />
            <AvatarFallback className="bg-gray-700 text-white">
              {(post.authorName || post.authorUsername || 'U').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 min-w-0">
                <h3 className="text-white font-semibold truncate">
                  {post.authorName || post.authorUsername}
                </h3>
                {getVerificationIcon()}
                <span className="text-gray-500 truncate">
                  @{post.authorUsername}
                </span>
                <span className="text-gray-500">·</span>
                <span className="text-gray-500 text-sm flex-shrink-0">
                  {formatDate(post.createdAt)}
                </span>
              </div>
              
              {showRemoveButton && onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRemove}
                  className="text-gray-500 hover:text-red-500 hover:bg-gray-800 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <div className="text-white mt-2 leading-relaxed">
              {post.content || 'No content available'}
            </div>
            
            {renderMedia()}
            
            {post.lang && post.lang !== 'en' && (
              <Badge variant="secondary" className="mt-2 text-xs">
                {post.lang.toUpperCase()}
              </Badge>
            )}
            
            {renderEngagementMetrics()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
