
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== TWITTER CALLBACK FUNCTION STARTED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    console.log('OAuth callback parameters:', { 
      code: code ? 'present' : 'missing', 
      state: state ? state : 'missing', 
      error: error ? error : 'none' 
    });

    // Handle OAuth error
    if (error) {
      console.error('Twitter OAuth error:', error);
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head><title>Authentication Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1>Authentication Error</h1>
            <p style="color: red;">OAuth Error: ${error}</p>
            <script>
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({ 
                    type: 'twitter-auth-error', 
                    error: '${error}' 
                  }, '*');
                }
              } catch (e) {
                console.error('Error posting message:', e);
              }
              setTimeout(() => window.close(), 3000);
            </script>
            <p><button onclick="window.close()">Close Window</button></p>
          </body>
        </html>
      `, { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'text/html'
        } 
      });
    }

    // Check required parameters
    if (!code || !state) {
      console.error('Missing required parameters:', { code: !!code, state: !!state });
      const errorMsg = `Missing ${!code ? 'code' : 'state'} parameter`;
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head><title>Authentication Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1>Authentication Error</h1>
            <p style="color: red;">${errorMsg}</p>
            <script>
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({ 
                    type: 'twitter-auth-error', 
                    error: '${errorMsg}' 
                  }, '*');
                }
              } catch (e) {
                console.error('Error posting message:', e);
              }
              setTimeout(() => window.close(), 3000);
            </script>
            <p><button onclick="window.close()">Close Window</button></p>
          </body>
        </html>
      `, { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'text/html'
        } 
      });
    }

    console.log('Valid OAuth callback received, processing...');

    // Initialize Supabase with service role key for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service key available:', !!supabaseServiceKey);
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get stored auth session using state parameter
    console.log('Looking up auth session for state:', state);
    const { data: authSession, error: sessionError } = await supabase
      .from('twitter_auth_sessions')
      .select('user_id, code_verifier')
      .eq('state', state)
      .single();

    console.log('Auth session lookup result:', { 
      found: !!authSession, 
      error: sessionError?.message,
      userId: authSession?.user_id 
    });

    if (sessionError || !authSession) {
      console.error('Invalid or expired auth session:', sessionError);
      const errorMsg = 'Invalid or expired authentication session';
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head><title>Authentication Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1>Authentication Error</h1>
            <p style="color: red;">${errorMsg}</p>
            <script>
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({ 
                    type: 'twitter-auth-error', 
                    error: '${errorMsg}' 
                  }, '*');
                }
              } catch (e) {
                console.error('Error posting message:', e);
              }
              setTimeout(() => window.close(), 3000);
            </script>
            <p><button onclick="window.close()">Close Window</button></p>
          </body>
        </html>
      `, { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'text/html'
        } 
      });
    }

    const userId = authSession.user_id;
    const codeVerifier = authSession.code_verifier;
    console.log('Retrieved auth session for user:', userId);
    
    // Exchange code for access token
    const clientId = Deno.env.get('TWITTER_CLIENT_ID');
    const clientSecret = Deno.env.get('TWITTER_CLIENT_SECRET');
    const redirectUri = `${supabaseUrl}/functions/v1/twitter-callback`;

    console.log('Token exchange config:', { 
      clientId: clientId ? 'present' : 'missing', 
      clientSecret: clientSecret ? 'present' : 'missing', 
      redirectUri,
      codeVerifier: codeVerifier ? 'present' : 'missing'
    });

    if (!clientId || !clientSecret) {
      console.error('Missing Twitter credentials');
      const errorMsg = 'Server configuration error - missing Twitter credentials';
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head><title>Server Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1>Server Error</h1>
            <p style="color: red;">${errorMsg}</p>
            <script>
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({ 
                    type: 'twitter-auth-error', 
                    error: '${errorMsg}' 
                  }, '*');
                }
              } catch (e) {
                console.error('Error posting message:', e);
              }
              setTimeout(() => window.close(), 3000);
            </script>
            <p><button onclick="window.close()">Close Window</button></p>
          </body>
        </html>
      `, { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'text/html'
        } 
      });
    }

    // Create Basic Auth header for Twitter API
    const credentials = btoa(`${clientId}:${clientSecret}`);
    
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    console.log('Making token exchange request to Twitter...');
    
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: tokenParams.toString()
    });

    const responseText = await tokenResponse.text();
    console.log('Token response status:', tokenResponse.status);
    console.log('Token response body:', responseText);

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', responseText);
      const errorMsg = 'Failed to exchange authorization code for access token';
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head><title>Authentication Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1>Authentication Error</h1>
            <p style="color: red;">${errorMsg}</p>
            <script>
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({ 
                    type: 'twitter-auth-error', 
                    error: '${errorMsg}' 
                  }, '*');
                }
              } catch (e) {
                console.error('Error posting message:', e);
              }
              setTimeout(() => window.close(), 3000);
            </script>
            <p><button onclick="window.close()">Close Window</button></p>
          </body>
        </html>
      `, { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'text/html'
        } 
      });
    }

    const tokenData = JSON.parse(responseText);
    console.log('Successfully received tokens from Twitter');
    
    // Store tokens in database using service role
    console.log('Storing Twitter connection in database...');
    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 7200) * 1000).toISOString();
    
    const { error: dbError } = await supabase
      .from('twitter_connections')
      .upsert({
        user_id: userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: expiresAt,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (dbError) {
      console.error('Database error storing connection:', dbError);
      const errorMsg = 'Failed to save Twitter connection';
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head><title>Database Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1>Database Error</h1>
            <p style="color: red;">${errorMsg}</p>
            <p style="color: #666; font-size: 14px;">Error: ${dbError.message}</p>
            <script>
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({ 
                    type: 'twitter-auth-error', 
                    error: '${errorMsg}' 
                  }, '*');
                }
              } catch (e) {
                console.error('Error posting message:', e);
              }
              setTimeout(() => window.close(), 3000);
            </script>
            <p><button onclick="window.close()">Close Window</button></p>
          </body>
        </html>
      `, { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'text/html'
        } 
      });
    }

    console.log('Twitter connection stored successfully');

    // Clean up auth session
    console.log('Cleaning up auth session...');
    await supabase
      .from('twitter_auth_sessions')
      .delete()
      .eq('state', state);

    console.log('=== TWITTER CONNECTION COMPLETED SUCCESSFULLY ===');

    // Return success page that communicates with parent window
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Success</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; 
              padding: 40px 20px; 
              text-align: center; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              margin: 0;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            .success-icon { font-size: 64px; margin-bottom: 20px; }
            .success-title { font-size: 28px; font-weight: 600; margin-bottom: 10px; }
            .success-message { font-size: 18px; opacity: 0.9; margin-bottom: 30px; }
            .loading { color: rgba(255,255,255,0.8); margin: 10px 0; }
            button { 
              background: rgba(255,255,255,0.2); 
              border: 1px solid rgba(255,255,255,0.3); 
              color: white; 
              padding: 12px 24px; 
              border-radius: 8px; 
              cursor: pointer; 
              font-size: 16px;
              backdrop-filter: blur(10px);
            }
            button:hover { background: rgba(255,255,255,0.3); }
          </style>
        </head>
        <body>
          <div class="success-icon">🎉</div>
          <h1 class="success-title">Success!</h1>
          <p class="success-message">Your Twitter account has been connected successfully!</p>
          <p class="loading">Closing window...</p>
          <script>
            console.log('=== SUCCESS PAGE LOADED ===');
            console.log('Attempting to notify parent window...');
            
            let messageSent = false;
            
            function sendSuccessMessage() {
              if (messageSent) return;
              
              try {
                if (window.opener && !window.opener.closed) {
                  console.log('Sending success message to parent window');
                  window.opener.postMessage({ 
                    type: 'twitter-auth-success',
                    timestamp: Date.now()
                  }, '*');
                  messageSent = true;
                  console.log('Success message sent successfully');
                  
                  setTimeout(() => {
                    console.log('Closing popup window');
                    window.close();
                  }, 2000);
                } else {
                  console.log('No opener window found or it was closed');
                  setTimeout(() => window.close(), 3000);
                }
              } catch (e) {
                console.error('Error sending success message:', e);
                setTimeout(() => window.close(), 3000);
              }
            }
            
            // Try multiple times to ensure message delivery
            sendSuccessMessage();
            setTimeout(sendSuccessMessage, 100);
            setTimeout(sendSuccessMessage, 500);
            setTimeout(sendSuccessMessage, 1000);
            
            // Fallback: close window after 5 seconds
            setTimeout(() => {
              if (!window.closed) {
                console.log('Force closing window after timeout');
                window.close();
              }
            }, 5000);
          </script>
          <button onclick="window.close()">Close Window</button>
        </body>
      </html>
    `, { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'text/html'
      } 
    });

  } catch (error) {
    console.error('=== TWITTER CALLBACK ERROR ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    
    const errorMsg = `Unexpected error: ${error.message}`;
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>Unexpected Error</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h1>Unexpected Error</h1>
          <p style="color: red;">${errorMsg}</p>
          <script>
            try {
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage({ 
                  type: 'twitter-auth-error', 
                  error: 'Unexpected authentication error' 
                }, '*');
              }
            } catch (e) {
              console.error('Error posting message:', e);
            }
            setTimeout(() => window.close(), 3000);
          </script>
          <p><button onclick="window.close()">Close Window</button></p>
        </body>
        </html>
    `, { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'text/html'
      } 
    });
  }
});
