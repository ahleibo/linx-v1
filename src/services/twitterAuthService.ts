
import { supabase } from '@/integrations/supabase/client';

export class TwitterAuthService {
  // Get current session token for authentication
  private static async getAuthToken(): Promise<string | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log('Getting auth token:', { 
        hasSession: !!session, 
        hasAccessToken: !!session?.access_token,
        error: error?.message 
      });
      
      if (error) {
        console.error('Failed to get session:', error);
        return null;
      }
      
      if (!session?.access_token) {
        console.error('No access token in session');
        return null;
      }
      
      return session.access_token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Check if user has Twitter connected
  static async isTwitterConnected(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        console.log('No auth token available for Twitter connection check');
        return false;
      }

      console.log('Checking Twitter connection with token available');

      const { data, error } = await supabase.functions.invoke('check-twitter-connection', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (error) {
        console.error('Check connection error:', error);
        return false;
      }
      
      console.log('Connection check response:', data);
      return data?.connected || false;
    } catch (error) {
      console.error('Error checking Twitter connection:', error);
      return false;
    }
  }

  // Initiate Twitter OAuth flow
  static async connectTwitter(): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { success: false, error: 'User not authenticated. Please log in first.' };
      }

      console.log('Starting Twitter OAuth flow with token available');

      const { data, error } = await supabase.functions.invoke('twitter-auth', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (error) {
        console.error('Twitter auth function error:', error);
        return { success: false, error: error.message || 'Failed to start OAuth flow' };
      }

      if (data?.authUrl) {
        console.log('Opening Twitter OAuth window:', data.authUrl);
        
        // Open Twitter OAuth in new window with better popup settings
        const popup = window.open(
          data.authUrl, 
          'twitter-auth', 
          'width=600,height=700,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
        );
        
        if (!popup) {
          return { success: false, error: 'Popup blocked. Please allow popups for this site and try again.' };
        }
        
        // Return promise that resolves when auth completes
        return new Promise((resolve) => {
          let resolved = false;
          
          const handleMessage = (event: MessageEvent) => {
            console.log('Received message from popup:', event.data);
            
            if (resolved) return;
            
            if (event.data?.type === 'twitter-auth-success') {
              console.log('Twitter auth successful');
              resolved = true;
              cleanup();
              resolve({ success: true });
            } else if (event.data?.type === 'twitter-auth-error') {
              console.error('Twitter auth error from popup:', event.data.error);
              resolved = true;
              cleanup();
              resolve({ success: false, error: event.data.error || 'Authentication failed' });
            }
          };
          
          const cleanup = () => {
            window.removeEventListener('message', handleMessage);
            if (checkClosedInterval) {
              clearInterval(checkClosedInterval);
            }
          };
          
          window.addEventListener('message', handleMessage);
          
          // Check if popup was closed manually
          const checkClosedInterval = setInterval(() => {
            if (popup.closed) {
              console.log('Popup was closed manually');
              if (!resolved) {
                resolved = true;
                cleanup();
                resolve({ success: false, error: 'Authentication was cancelled. Please try again.' });
              }
            }
          }, 1000);
          
          // Timeout after 5 minutes
          setTimeout(() => {
            if (!resolved) {
              console.log('Authentication timeout');
              resolved = true;
              cleanup();
              if (!popup.closed) {
                popup.close();
              }
              resolve({ success: false, error: 'Authentication timed out. Please try again.' });
            }
          }, 300000); // 5 minutes
        });
      }

      return { success: false, error: 'No authentication URL received from server' };
    } catch (error: any) {
      console.error('Twitter auth error:', error);
      return { success: false, error: error.message || 'Failed to connect Twitter account' };
    }
  }

  // Import bookmarks from Twitter
  static async importBookmarks(): Promise<{ success: boolean; error?: string; imported?: number }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase.functions.invoke('import-twitter-bookmarks', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        imported: data?.imported || 0 
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to import bookmarks' };
    }
  }

  // Disconnect Twitter account
  static async disconnectTwitter(): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase.functions.invoke('disconnect-twitter', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to disconnect Twitter account' };
    }
  }
}
