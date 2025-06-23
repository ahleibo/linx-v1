
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Link, AlertCircle } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);

  const validateUrl = (url: string): boolean => {
    const cleanUrl = url.trim();
    const patterns = [
      /^https?:\/\/(?:www\.)?(?:x|twitter)\.com\/\w+\/status\/\d+/i,
      /^(?:x|twitter)\.com\/\w+\/status\/\d+/i,
      /^www\.(?:x|twitter)\.com\/\w+\/status\/\d+/i
    ];
    
    return patterns.some(pattern => pattern.test(cleanUrl));
  };

  const handleFetchPost = async () => {
    console.log('Starting fetch process for URL:', urlInput);
    setError(null);
    
    if (!urlInput.trim()) {
      setError("Please enter a valid X post URL.");
      return;
    }

    if (!validateUrl(urlInput.trim())) {
      setError("Please enter a valid X/Twitter post URL (e.g., https://x.com/username/status/123456789)");
      return;
    }

    setIsFetching(true);
    
    try {
      console.log('Attempting to fetch post from URL:', urlInput.trim());
      const postData = await XPostFetcher.fetchPostData(urlInput.trim());
      
      if (postData) {
        console.log('Post data fetched successfully:', postData);
        onPostFetched(postData);
        setUrlInput('');
        setError(null);
        toast({
          title: "Post fetched successfully",
          description: "Review the post below and click Import to save it."
        });
      } else {
        console.error('No post data returned from fetcher');
        setError("Unable to fetch post data. Please check the URL and try again.");
        toast({
          title: "Unable to fetch post",
          description: "Please check the URL and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching post:', error);
      setError(`Failed to fetch post data: ${error.message || 'Unknown error'}`);
      toast({
        title: "Error fetching post",
        description: `Failed to fetch post data: ${error.message || 'Please try again.'}`,
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
            onChange={(e) => {
              setUrlInput(e.target.value);
              setError(null);
            }}
            className={`bg-slate-700/50 border-slate-600 text-white flex-1 ${
              error ? 'border-red-500' : ''
            }`}
            onKeyPress={(e) => e.key === 'Enter' && !isFetching && handleFetchPost()}
            disabled={isFetching}
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
        
        {error && (
          <div className="flex items-center space-x-2 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        
        <p className="text-sm text-slate-400">
          Paste an X (Twitter) post URL to automatically fetch all post data. 
          Supports x.com and twitter.com URLs.
        </p>
      </div>
    </div>
  );
};
