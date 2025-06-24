
import { supabase } from '@/integrations/supabase/client';

export class TwitterAuthService {
  // Check if user has Twitter connected
  static async isTwitterConnected(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('check-twitter-connection');
      return data?.connected || false;
    } catch (error) {
      console.error('Error checking Twitter connection:', error);
      return false;
    }
  }

  // Initiate Twitter OAuth flow
  static async connectTwitter(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('twitter-auth');
      
      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.authUrl) {
        // Open Twitter OAuth in new window
        window.open(data.authUrl, 'twitter-auth', 'width=600,height=600');
        return { success: true };
      }

      return { success: false, error: 'No auth URL received' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to connect Twitter' };
    }
  }

  // Import bookmarks from Twitter
  static async importBookmarks(): Promise<{ success: boolean; error?: string; imported?: number }> {
    try {
      const { data, error } = await supabase.functions.invoke('import-twitter-bookmarks');
      
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
      const { data, error } = await supabase.functions.invoke('disconnect-twitter');
      
      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to disconnect Twitter' };
    }
  }
}
