
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { postImportService, type XPostData } from '@/services/postImportService';
import { XPostFetcher } from '@/services/xPostFetcher';
import { TweetCard } from './TweetCard';

interface PostImportFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PostImportForm = ({ onSuccess, onCancel }: PostImportFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [fetchedPosts, setFetchedPosts] = useState<XPostData[]>([]);

  const handleFetchPost = async () => {
    if (!urlInput.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a valid X post URL.",
        variant: "destructive"
      });
      return;
    }

    setIsFetching(true);
    try {
      const postData = await XPostFetcher.fetchPostData(urlInput.trim());
      
      if (postData) {
        // Check if post already exists in the list
        const exists = fetchedPosts.some(post => post.url === postData.url);
        if (!exists) {
          setFetchedPosts(prev => [...prev, postData]);
          setUrlInput('');
          toast({
            title: "Post fetched successfully",
            description: "Review the post below and click Import to save it."
          });
        } else {
          toast({
            title: "Post already added",
            description: "This post is already in your import list.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Unable to fetch post",
          description: "Please check the URL and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error fetching post",
        description: "Failed to fetch post data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleRemovePost = (index: number) => {
    setFetchedPosts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        {/* URL Input Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">X Post URL</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="https://x.com/username/status/123456789"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleFetchPost()}
              />
              <Button
                type="button"
                onClick={handleFetchPost}
                disabled={isFetching || !urlInput.trim()}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-slate-400">
              Paste an X (Twitter) post URL to automatically fetch all post data
            </p>
          </div>
        </div>

        {/* Fetched Posts Preview */}
        {fetchedPosts.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Posts to Import ({fetchedPosts.length})
              </h3>
            </div>
            
            <div className="max-h-96 overflow-y-auto space-y-4">
              {fetchedPosts.map((post, index) => (
                <TweetCard
                  key={index}
                  post={post}
                  onRemove={() => handleRemovePost(index)}
                  showRemoveButton={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || fetchedPosts.length === 0}
            className="flex-1 bg-blue-500 hover:bg-blue-600"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Import {fetchedPosts.length > 0 && `${fetchedPosts.length} Post${fetchedPosts.length > 1 ? 's' : ''}`}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
