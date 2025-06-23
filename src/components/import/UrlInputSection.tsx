
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { XPostFetcher } from '@/services/xPostFetcher';
import { type XPostData } from '@/services/postImportService';

interface UrlInputSectionProps {
  onPostFetched: (post: XPostData) => void;
}

export const UrlInputSection = ({ onPostFetched }: UrlInputSectionProps) => {
  const { toast } = useToast();
  const [isFetching, setIsFetching] = useState(false);
  const [urlInput, setUrlInput] = useState('');

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
        onPostFetched(postData);
        setUrlInput('');
        toast({
          title: "Post fetched successfully",
          description: "Review the post below and click Import to save it."
        });
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

  return (
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
  );
};
