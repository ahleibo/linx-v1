
import React, { useState, useEffect } from 'react';
import { Twitter, Download, CheckCircle, AlertCircle, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SimpleTwitterAuth } from '@/services/simpleTwitterAuth';

export const SimpleTwitterImport = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const connected = await SimpleTwitterAuth.isConnected();
      setIsConnected(connected);
    } catch (error) {
      console.error('Error checking connection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const result = await SimpleTwitterAuth.connectTwitter();
      
      if (result.success) {
        setIsConnected(true);
        toast({
          title: "Twitter Connected!",
          description: "Your Twitter account has been successfully connected.",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect Twitter account",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const result = await SimpleTwitterAuth.importBookmarks();
      
      if (result.success) {
        toast({
          title: "Import Successful!",
          description: `Imported ${result.data?.imported || 0} bookmarked posts.`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: result.error || "Failed to import bookmarks",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const result = await SimpleTwitterAuth.disconnect();
      
      if (result.success) {
        setIsConnected(false);
        toast({
          title: "Twitter Disconnected",
          description: "Your Twitter account has been disconnected.",
        });
      } else {
        toast({
          title: "Disconnect Failed",
          description: result.error || "Failed to disconnect Twitter account",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Disconnect Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800/30 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
            <span className="ml-2 text-slate-300">Checking Twitter connection...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/30 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Twitter className="h-5 w-5 text-blue-400" />
          Twitter Bookmarks Import (Simple)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <>
            <p className="text-slate-300 text-sm">
              Connect your Twitter account to import all your bookmarked posts.
            </p>
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect Twitter Account
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Twitter account connected</span>
            </div>
            
            <div className="space-y-3">
              <Button
                onClick={handleImport}
                disabled={isImporting}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Import Bookmarks
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Disconnect Twitter
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
