
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { postImportService, type XPostData } from '@/services/postImportService';
import { UrlInputSection } from './UrlInputSection';
import { PostPreviewSection } from './PostPreviewSection';
import { ImportActions } from './ImportActions';

interface PostImportFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PostImportForm = ({ onSuccess, onCancel }: PostImportFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedPosts, setFetchedPosts] = useState<XPostData[]>([]);

  const handlePostFetched = (postData: XPostData) => {
    // Check if post already exists in the list
    const exists = fetchedPosts.some(post => post.url === postData.url);
    if (!exists) {
      setFetchedPosts(prev => [...prev, postData]);
    } else {
      toast({
        title: "Post already added",
        description: "This post is already in your import list.",
        variant: "destructive"
      });
    }
  };

  const handleRemovePost = (index: number) => {
    setFetchedPosts(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (fetchedPosts.length === 0) {
      toast({
        title: "No posts to import",
        description: "Please fetch at least one post before importing.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const results = await postImportService.importMultiplePosts(fetchedPosts);
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      if (successful > 0) {
        toast({
          title: "Posts imported successfully",
          description: `${successful} post${successful > 1 ? 's' : ''} imported${failed > 0 ? `, ${failed} failed` : ''}.`
        });
        setFetchedPosts([]);
        onSuccess?.();
      } else {
        toast({
          title: "Import failed",
          description: "No posts could be imported. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Import error",
        description: "Failed to import posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-slate-800/30 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Import X Posts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <UrlInputSection onPostFetched={handlePostFetched} />
        
        <PostPreviewSection 
          posts={fetchedPosts}
          onRemovePost={handleRemovePost}
        />

        <ImportActions
          isLoading={isLoading}
          postsCount={fetchedPosts.length}
          onImport={handleImport}
          onCancel={onCancel}
        />
      </CardContent>
    </Card>
  );
};
