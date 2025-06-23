
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { TwitterApiService } from '@/services/twitterApiService';
import { EnhancedXPostData } from '@/types/twitter';

interface EnhancedUrlInputSectionProps {
  onAddPost: (post: EnhancedXPostData) => void;
  isLoading?: boolean;
}

export const EnhancedUrlInputSection = ({ 
  onAddPost, 
  isLoading = false 
}: EnhancedUrlInputSectionProps) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const validateUrl = (inputUrl: string): boolean => {
    return TwitterApiService.validateTwitterUrl(inputUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setError(null);
    setSuccess(null);

    // Validate URL format
    if (!validateUrl(url)) {
      setError('Please enter a valid Twitter/X URL (e.g., https://twitter.com/username/status/123456)');
      return;
    }

    setIsFetching(true);

    try {
      console.log('Fetching tweet data for:', url);
      const postData = await TwitterApiService.fetchTweetData(url);
      
      // Always add the post data, even if it's basic fallback data
      if (postData) {
        onAddPost(postData);
        setUrl('');
        setSuccess('Tweet loaded successfully! Preview it below.');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        // This should never happen now since we always return fallback data
        setError('Failed to load tweet data. Please check the URL and try again.');
      }
    } catch (err) {
      console.error('Error fetching tweet:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tweet. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setError(null);
    setSuccess(null);
  };

  const getSupportedFormats = () => [
    'https://twitter.com/username/status/123456',
    'https://x.com/username/status/123456',
    'https://mobile.twitter.com/username/status/123456',
    'https://mobile.x.com/username/status/123456'
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">
          Add Twitter/X Posts
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Paste Twitter or X URLs to preview and import posts. Even if we can't fetch full details, we'll create a basic preview.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="Paste Twitter/X URL here (e.g., https://twitter.com/username/status/123456)"
            value={url}
            onChange={handleUrlChange}
            disabled={isLoading || isFetching}
            className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-500"
          />
          <Button
            type="submit"
            disabled={!url.trim() || isLoading || isFetching || !validateUrl(url)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            {isFetching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Plus className="w-4 w-4 mr-2" />
                Add Post
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert className="border-red-800 bg-red-900/20">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-800 bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-300">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-gray-500">
          <p className="mb-2">Supported URL formats:</p>
          <ul className="space-y-1 ml-4">
            {getSupportedFormats().map((format, index) => (
              <li key={index} className="flex items-center">
                <span className="w-1 h-1 bg-gray-500 rounded-full mr-2"></span>
                <code className="bg-gray-800 px-2 py-1 rounded text-xs">{format}</code>
              </li>
            ))}
          </ul>
        </div>
      </form>
    </div>
  );
};
