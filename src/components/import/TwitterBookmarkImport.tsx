
import React, { useState, useEffect } from 'react';
import { Twitter, Download, CheckCircle, AlertCircle, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { TwitterAuthService } from '@/services/twitterAuthService';

export const TwitterBookmarkImport = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Only check connection status after a delay to ensure user is properly authenticated
    const checkConnection = async () => {
      try {
        setCheckingConnection(true);
        setConnectionError(null);
        
        // Add a small delay to ensure auth is stable
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const connected = await TwitterAuthService.isTwitterConnected();
        setIsConnected(connected);
      } catch (error: any) {
        console.error('Error checking Twitter connection:', error);
        setConnectionError(error.message || 'Failed to check connection status');
        setIsConnected(false);
      } finally {
        setCheckingConnection(false);
      }
    };

    checkConnection();
  }, []);

  const handleConnectTwitter = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      const result = await TwitterAuthService.connectTwitter();
      
      if (result.success) {
        setIsConnected(true);
        toast({
          title: "Twitter Connected!",
          description: "Your Twitter account has been successfully connected.",
        });
      } else {
        setConnectionError(result.error || 'Failed to connect Twitter account');
        toast({
          title: "Connection Failed",
          description: result.error || "Failed to connect Twitter account",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      const errorMessage = error.message || "An unexpected error occurred";
      setConnectionError(errorMessage);
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleImportBookmarks = async () => {
    setIsImporting(true);
    const result = await TwitterAuthService.importBookmarks();
    
    if (result.success) {
      toast({
        title: "Import Successful!",
        description: `Successfully imported ${result.imported || 0} bookmarked posts.`,
      });
    } else {
      // Check if it's a rate limit error
      if (result.error && result.error.includes('rate limit')) {
        toast({
          title: "Rate Limit Exceeded",
          description: "Twitter has temporarily limited bookmark requests. Please wait 15 minutes before trying again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Import Failed",
          description: result.error || "Failed to import bookmarks",
          variant: "destructive",
        });
      }
    }
    
    setIsImporting(false);
  };

  const handleDisconnect = async () => {
    const result = await TwitterAuthService.disconnectTwitter();
    
    if (result.success) {
      setIsConnected(false);
      setConnectionError(null);
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
  };

  const handleRetryConnection = async () => {
    setCheckingConnection(true);
    setConnectionError(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const connected = await TwitterAuthService.isTwitterConnected();
      setIsConnected(connected);
    } catch (error: any) {
      console.error('Retry connection check failed:', error);
      setConnectionError(error.message || 'Failed to check connection status');
    } finally {
      setCheckingConnection(false);
    }
  };

  if (checkingConnection) {
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
          Twitter Bookmarks Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectionError && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <div className="flex-1">
              <p className="text-sm text-red-400">{connectionError}</p>
            </div>
            <Button
              onClick={handleRetryConnection}
              size="sm"
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              Retry
            </Button>
          </div>
        )}

        {!isConnected ? (
          <>
            <p className="text-slate-300 text-sm">
              Connect your Twitter account to import all your bookmarked posts automatically.
            </p>
            <Button
              onClick={handleConnectTwitter}
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
                onClick={handleImportBookmarks}
                disabled={isImporting}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing Bookmarks...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Import All Bookmarks
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
            
            <div className="text-xs text-slate-500 space-y-1">
              <p>• Imports all your Twitter bookmarks</p>
              <p>• Preserves original post data and media</p>
              <p>• Safe and secure OAuth connection</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
