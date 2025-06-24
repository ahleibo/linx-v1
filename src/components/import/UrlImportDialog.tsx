
import React, { useState } from 'react';
import { Link, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { XPostImportService } from '@/services/xPostImportService';

interface UrlImportDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export const UrlImportDialog = ({ trigger, onSuccess }: UrlImportDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const handleImport = async () => {
    if (!url.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid X/Twitter post URL",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportStatus('idle');

    try {
      const result = await XPostImportService.importFromUrl(url);

      if (result.success) {
        setImportStatus('success');
        toast({
          title: "Import Successful",
          description: "Post has been imported to your library",
        });
        setUrl('');
        onSuccess?.();
        setTimeout(() => {
          setIsOpen(false);
          setImportStatus('idle');
        }, 1500);
      } else {
        setImportStatus('error');
        toast({
          title: "Import Failed",
          description: result.error || "Failed to import post",
          variant: "destructive",
        });
      }
    } catch (error) {
      setImportStatus('error');
      toast({
        title: "Import Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isImporting && url.trim()) {
      handleImport();
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
      <Link className="h-4 w-4 mr-2" />
      Import from URL
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5 text-blue-400" />
            Import X Post
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url" className="text-slate-300">
              X/Twitter Post URL
            </Label>
            <Input
              id="url"
              placeholder="https://x.com/username/status/123456789"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-slate-800 border-slate-600 text-white placeholder-slate-400"
              disabled={isImporting}
            />
            <p className="text-xs text-slate-400">
              Paste the URL of any public X/Twitter post
            </p>
          </div>

          <Button
            onClick={handleImport}
            disabled={isImporting || !url.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {importStatus === 'success' && <CheckCircle className="h-4 w-4 mr-2 text-green-400" />}
            {importStatus === 'error' && <AlertCircle className="h-4 w-4 mr-2 text-red-400" />}
            
            {isImporting ? 'Importing...' : 
             importStatus === 'success' ? 'Imported!' :
             importStatus === 'error' ? 'Failed' :
             'Import Post'}
          </Button>

          <div className="text-xs text-slate-500 space-y-1">
            <p>• Works with public posts from x.com and twitter.com</p>
            <p>• Imports text, media, and engagement metrics</p>
            <p>• No X account login required</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
