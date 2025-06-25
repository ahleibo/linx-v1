
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const TwitterCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          localStorage.setItem('twitter_auth_result', JSON.stringify({
            success: false,
            error: error
          }));
          window.close();
          return;
        }

        if (!code || !state) {
          localStorage.setItem('twitter_auth_result', JSON.stringify({
            success: false,
            error: 'Missing authorization code or state'
          }));
          window.close();
          return;
        }

        // Verify state
        const savedState = localStorage.getItem('twitter_auth_state');
        if (state !== savedState) {
          localStorage.setItem('twitter_auth_result', JSON.stringify({
            success: false,
            error: 'Invalid state parameter'
          }));
          window.close();
          return;
        }

        // Exchange code for token
        const { data, error: exchangeError } = await supabase.functions.invoke('exchange-twitter-token', {
          body: { code, state }
        });

        if (exchangeError || !data?.success) {
          localStorage.setItem('twitter_auth_result', JSON.stringify({
            success: false,
            error: exchangeError?.message || 'Token exchange failed'
          }));
        } else {
          localStorage.setItem('twitter_auth_result', JSON.stringify({
            success: true,
            data: data
          }));
        }

        window.close();
      } catch (error: any) {
        localStorage.setItem('twitter_auth_result', JSON.stringify({
          success: false,
          error: error.message || 'Callback processing failed'
        }));
        window.close();
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing Twitter authentication...</p>
      </div>
    </div>
  );
};
