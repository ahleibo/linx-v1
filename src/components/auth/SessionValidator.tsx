
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const SessionValidator = () => {
  const { user, session, refreshSession } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const validateSession = async () => {
      if (user && session) {
        try {
          // Test if the session is valid by making a simple request to Supabase
          const { data, error } = await supabase.from('profiles').select('id').limit(1);
          
          if (error) {
            console.warn('Session validation failed, attempting refresh');
            const refreshed = await refreshSession();
            if (!refreshed) {
              toast({
                title: "Session Expired",
                description: "Your session has expired. Please sign in again.",
                variant: "destructive",
              });
            }
          }
        } catch (error) {
          console.error('Session validation error:', error);
        }
      }
    };

    // Validate session every 5 minutes
    const interval = setInterval(validateSession, 5 * 60 * 1000);
    
    // Initial validation
    validateSession();

    return () => clearInterval(interval);
  }, [user, session, refreshSession, toast]);

  return null; // This is a utility component with no UI
};
