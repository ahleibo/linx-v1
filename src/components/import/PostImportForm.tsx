
import React, { useState } from 'react';
import { EnhancedUrlInputSection } from './EnhancedUrlInputSection';
import { PostPreviewSection } from './PostPreviewSection';
import { ImportActions } from './ImportActions';
import { type EnhancedXPostData } from '@/types/twitter';

interface PostImportFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PostImportForm = ({ onSuccess, onCancel }: PostImportFormProps) => {
  const [posts, setPosts] = useState<EnhancedXPostData[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleAddPost = (post: EnhancedXPostData) => {
    // Check for duplicates
    const isDuplicate = posts.some(existingPost => 
      existingPost.id === post.id || existingPost.url === post.url
    );
    
    if (isDuplicate) {
      console.log('Post already added:', post.url);
      return;
    }

    setPosts(prev => [...prev, post]);
  };

  const handleRemovePost = (index: number) => {
    setPosts(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setPosts([]);
  };

  const handleImport = async () => {
    if (posts.length === 0) return;
    
    setIsImporting(true);
    try {
      // Import logic will be handled by ImportActions component
      console.log('Importing posts:', posts);
      onSuccess?.();
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <EnhancedUrlInputSection
        onAddPost={handleAddPost}
        isLoading={isImporting}
      />
      
      <PostPreviewSection
        posts={posts}
        onRemovePost={handleRemovePost}
      />
      
      {posts.length > 0 && (
        <ImportActions
          isLoading={isImporting}
          postsCount={posts.length}
          onImport={handleImport}
          onCancel={onCancel}
        />
      )}
    </div>
  );
};
