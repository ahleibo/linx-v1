
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XPostImportService } from '@/services/xPostImportService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Twitter } from 'lucide-react';

export const XPostImport = () => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    try {
      const result = await XPostImportService.importFromUrl(url);
      
      if (result.success) {
        toast({
          title: result.isExisting ? "Post Already Exists" : "Post Imported Successfully",
          description: result.isExisting 
            ? "This post is already in your collection"
            : "X post has been added to your collection",
        });
        setUrl('');
      } else {
        toast({
          title: "Import Failed",
          description: result.error || "Failed to import post",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-slate-800/30 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Twitter className="h-5 w-5 text-blue-400" />
          Import X Post
        </CardTitle>
        <CardDescription className="text-slate-400">
          Paste an X/Twitter post URL to import it
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleImport} className="space-y-4">
          <Input
            type="url"
            placeholder="https://x.com/username/status/123456789"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="bg-slate-700 border-slate-600 text-white"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={!url.trim() || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              'Import Post'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
