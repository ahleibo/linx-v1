
import React from 'react';
import { TweetCard } from './TweetCard';
import { type XPostData } from '@/services/postImportService';

interface PostPreviewSectionProps {
  posts: XPostData[];
  onRemovePost: (index: number) => void;
}

export const PostPreviewSection = ({ posts, onRemovePost }: PostPreviewSectionProps) => {
  if (posts.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Posts to Import ({posts.length})
        </h3>
      </div>
      
      <div className="max-h-96 overflow-y-auto space-y-4">
        {posts.map((post, index) => (
          <TweetCard
            key={index}
            post={post}
            onRemove={() => onRemovePost(index)}
            showRemoveButton={true}
          />
        ))}
      </div>
    </div>
  );
};
