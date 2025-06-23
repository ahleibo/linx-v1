
import React from 'react';
import { EnhancedTweetCard } from './EnhancedTweetCard';
import { type XPostData } from '@/services/postImportService';
import { type EnhancedXPostData } from '@/types/twitter';

interface TweetCardProps {
  post: XPostData;
  onRemove?: () => void;
  showRemoveButton?: boolean;
  className?: string;
}

// Transform XPostData to EnhancedXPostData for backward compatibility
const transformPostData = (post: XPostData): EnhancedXPostData => {
  return {
    id: post.url.split('/').pop() || Date.now().toString(),
    url: post.url,
    content: post.content,
    authorName: post.authorName,
    authorUsername: post.authorUsername,
    authorAvatar: post.authorAvatar,
    mediaUrls: post.mediaUrls || [],
    likesCount: post.likesCount || 0,
    retweetsCount: post.retweetsCount || 0,
    repliesCount: post.repliesCount || 0,
    createdAt: post.createdAt,
  };
};

export const TweetCard = ({ post, onRemove, showRemoveButton, className }: TweetCardProps) => {
  const enhancedPost = transformPostData(post);
  
  return (
    <EnhancedTweetCard
      post={enhancedPost}
      onRemove={onRemove}
      showRemoveButton={showRemoveButton}
      className={className}
    />
  );
};
