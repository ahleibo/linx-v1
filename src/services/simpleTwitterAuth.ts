
import { supabase } from '@/integrations/supabase/client';

interface TwitterAuthResult {
  success: boolean;
  error?: string;
  data?: any;
}

export class SimpleTwitterAuth {
  private static readonly TWITTER_AUTH_URL = 'https://twitter.com/i/oauth2/authorize';
  private static readonly REDIRECT_URI = `${window.location.origin}/twitter-callback`;

  // Generate a simple random state
  private static generateState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  // Start Twitter OAuth flow
  static async connectTwitter(): Promise<TwitterAuthResult> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Generate state and store in localStorage temporarily
      const state = this.generateState();
      localStorage.setItem('twitter_auth_state', state);
      localStorage.setItem('twitter_auth_user_id', user.id);

      // Build Twitter OAuth URL
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: 'YOUR_TWITTER_CLIENT_ID', // This will be replaced with actual client ID
        redirect_uri: this.REDIRECT_URI,
        scope: 'tweet.read users.read bookmark.read',
        state: state,
        code_challenge_method: 'plain',
        code_challenge: state // Using state as code challenge for simplicity
      });

      const authUrl = `${this.TWITTER_AUTH_URL}?${params.toString()}`;
      
      // Open popup
      const popup = window.open(
        authUrl,
        'twitter-auth',
        'width=500,height=600,scrollbars=yes'
      );

      if (!popup) {
        return { success: false, error: 'Popup blocked. Please allow popups.' };
      }

      // Wait for callback
      return new Promise((resolve) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            
            // Check if we got a success result
            const result = localStorage.getItem('twitter_auth_result');
            if (result) {
              localStorage.removeItem('twitter_auth_result');
              localStorage.removeItem('twitter_auth_state');
              localStorage.removeItem('twitter_auth_user_id');
              resolve(JSON.parse(result));
            } else {
              resolve({ success: false, error: 'Authentication cancelled' });
            }
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          if (!popup.closed) {
            popup.close();
          }
          resolve({ success: false, error: 'Authentication timed out' });
        }, 300000);
      });
    } catch (error: any) {
      return { success: false, error: error.message || 'Authentication failed' };
    }
  }

  // Check if user has Twitter connected
  static async isConnected(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('twitter_connections')
        .select('id')
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  }

  // Import bookmarks
  static async importBookmarks(): Promise<TwitterAuthResult> {
    try {
      const { data, error } = await supabase.functions.invoke('simple-twitter-import');
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message || 'Import failed' };
    }
  }

  // Disconnect Twitter
  static async disconnect(): Promise<TwitterAuthResult> {
    try {
      const { error } = await supabase
        .from('twitter_connections')
        .delete()
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Disconnect failed' };
    }
  }
}
