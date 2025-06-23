
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Repeat2, X } from 'lucide-react';
import { XPostData } from '@/services/postImportService';

interface TweetCardProps {
  post: XPostData;
  onRemove?: () => void;
  showRemoveButton?: boolean;
}

export const TweetCard = ({ post, onRemove, showRemoveButton = false }: TweetCardProps) => {
  const formatCount = (count: number = 0) => {
    if (count < 1000) return count.toString();
    return `${(count / 1000).toFixed(1)}K`;
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
    <Card className="bg-slate-800/30 border-slate-700 mb-4">
      <CardContent className="p-4">
        {showRemoveButton && (
          <div className="flex justify-end mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-slate-400 hover:text-red-400"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="flex space-x-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={post.authorAvatar} />
            <AvatarFallback className="bg-blue-500 text-white">
              {post.authorName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-semibold text-white">{post.authorName}</span>
              <span className="text-slate-400">@{post.authorUsername}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-400 text-sm">{formatDate(post.createdAt)}</span>
            </div>
            
            <p className="text-white mb-3 leading-relaxed">{post.content}</p>
            
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className="mb-3 rounded-lg overflow-hidden">
                <img
                  src={post.mediaUrls[0]}
                  alt="Tweet media"
                  className="w-full max-h-64 object-cover"
                />
              </div>
            )}
            
            <div className="flex items-center space-x-6 text-slate-400">
              <div className="flex items-center space-x-2 hover:text-blue-400 cursor-pointer">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">{formatCount(post.repliesCount)}</span>
              </div>
              <div className="flex items-center space-x-2 hover:text-green-400 cursor-pointer">
                <Repeat2 className="h-4 w-4" />
                <span className="text-sm">{formatCount(post.retweetsCount)}</span>
              </div>
              <div className="flex items-center space-x-2 hover:text-red-400 cursor-pointer">
                <Heart className="h-4 w-4" />
                <span className="text-sm">{formatCount(post.likesCount)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
