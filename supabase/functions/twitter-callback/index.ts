
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  console.log('Twitter callback function called');

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    console.log('Callback parameters:', { code: !!code, state, error });

    // Handle OAuth error
    if (error) {
      console.error('Twitter OAuth error:', error);
      return new Response(`
        <html>
          <head><title>Authentication Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1>Authentication Error</h1>
            <p style="color: red;">${error}</p>
            <script>
              console.log('Callback error - posting message to opener');
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({ 
                    type: 'twitter-auth-error', 
                    error: '${error}' 
                  }, '*');
                  setTimeout(() => window.close(), 2000);
                } else {
                  console.log('No opener window found');
                }
              } catch (e) {
                console.error('Error posting message:', e);
              }
            </script>
            <p><button onclick="window.close()">Close Window</button></p>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    // Check required parameters
    if (!code || !state) {
      console.error('Missing required parameters:', { code: !!code, state: !!state });
      const errorMsg = 'Missing required parameters';
      return new Response(`
        <html>
          <head><title>Authentication Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1>Authentication Error</h1>
            <p style="color: red;">${errorMsg}</p>
            <script>
              console.log('Callback parameter error - posting message to opener');
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({ 
                    type: 'twitter-auth-error', 
                    error: '${errorMsg}' 
                  }, '*');
                  setTimeout(() => window.close(), 2000);
                } else {
                  console.log('No opener window found');
                }
              } catch (e) {
                console.error('Error posting message:', e);
              }
            </script>
            <p><button onclick="window.close()">Close Window</button></p>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    // Get Supabase client with service role key (no user auth needed for callback)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get stored auth session using state parameter
    const { data: authSession, error: sessionError } = await supabase
      .from('twitter_auth_sessions')
      .select('user_id, code_verifier')
      .eq('state', state)
      .single();

    if (sessionError || !authSession) {
      console.error('Invalid or expired auth session:', sessionError);
      const errorMsg = 'Invalid or expired auth session';
      return new Response(`
        <html>
          <head><title>Authentication Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1>Authentication Error</h1>
            <p style="color: red;">${errorMsg}</p>
            <script>
              console.log('Session error - posting message to opener');
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({ 
                    type: 'twitter-auth-error', 
                    error: '${errorMsg}' 
                  }, '*');
                  setTimeout(() => window.close(), 2000);
                } else {
                  console.log('No opener window found');
                }
              } catch (e) {
                console.error('Error posting message:', e);
              }
            </script>
            <p><button onclick="window.close()">Close Window</button></p>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    const userId = authSession.user_id;
    const codeVerifier = authSession.code_verifier;
    console.log('Retrieved auth session for user:', userId);
    
    // Exchange code for access token
    const clientId = Deno.env.get('TWITTER_CLIENT_ID');
    const clientSecret = Deno.env.get('TWITTER_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/twitter-callback`;

    console.log('Token exchange details:', { 
      clientId: !!clientId, 
      clientSecret: !!clientSecret, 
      redirectUri,
      codeVerifier: !!codeVerifier
    });

    if (!clientId || !clientSecret) {
      console.error('Missing Twitter credentials');
      const errorMsg = 'Server configuration error';
      return new Response(`
        <html>
          <head><title>Server Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1>Server Error</h1>
            <p style="color: red;">${errorMsg}</p>
            <script>
              console.log('Config error - posting message to opener');
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({ 
                    type: 'twitter-auth-error', 
                    error: '${errorMsg}' 
                  }, '*');
                  setTimeout(() => window.close(), 2000);
                } else {
                  console.log('No opener window found');
                }
              } catch (e) {
                console.error('Error posting message:', e);
              }
            </script>
            <p><button onclick="window.close()">Close Window</button></p>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    // Create Basic Auth header
    const credentials = btoa(`${clientId}:${clientSecret}`);
    
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    });

    console.log('Making token request with params:', Object.fromEntries(tokenParams.entries()));
    
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
    console.log('Token response:', responseText);

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', responseText);
      const errorMsg = `Token exchange failed: ${responseText}`;
      return new Response(`
        <html>
          <head><title>Authentication Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1>Authentication Error</h1>
            <p style="color: red;">Token exchange failed</p>
            <details>
              <summary>Error Details</summary>
              <pre style="text-align: left; background: #f5f5f5; padding: 10px; border-radius: 4px;">${responseText}</pre>
            </details>
            <script>
              console.log('Token exchange error - posting message to opener');
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({ 
                    type: 'twitter-auth-error', 
                    error: 'Token exchange failed' 
                  }, '*');
                  setTimeout(() => window.close(), 2000);
                } else {
                  console.log('No opener window found');
                }
              } catch (e) {
                console.error('Error posting message:', e);
              }
            </script>
            <p><button onclick="window.close()">Close Window</button></p>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    const tokenData = JSON.parse(responseText);
    console.log('Token data received:', Object.keys(tokenData));
    
    // Store tokens in database
    const { error: dbError } = await supabase
      .from('twitter_connections')
      .upsert({
        user_id: userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || null,
        expires_at: new Date(Date.now() + (tokenData.expires_in || 7200) * 1000).toISOString(),
        connected_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Database error:', dbError);
      const errorMsg = 'Failed to save connection';
      return new Response(`
        <html>
          <head><title>Database Error</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h1>Database Error</h1>
            <p style="color: red;">${errorMsg}</p>
            <script>
              console.log('Database error - posting message to opener');
              try {
                if (window.opener && !window.opener.closed) {
                  window.opener.postMessage({ 
                    type: 'twitter-auth-error', 
                    error: '${errorMsg}' 
                  }, '*');
                  setTimeout(() => window.close(), 2000);
                } else {
                  console.log('No opener window found');
                }
              } catch (e) {
                console.error('Error posting message:', e);
              }
            </script>
            <p><button onclick="window.close()">Close Window</button></p>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    // Clean up auth session
    await supabase
      .from('twitter_auth_sessions')
      .delete()
      .eq('state', state);

    console.log('Twitter connection saved successfully');

    // Return success page that communicates with parent window
    return new Response(`
      <html>
        <head>
          <title>Authentication Success</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .success { color: green; font-size: 18px; margin: 20px 0; }
            .loading { color: #666; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>🎉 Success!</h1>
          <p class="success">Twitter account connected successfully!</p>
          <p class="loading">Closing window...</p>
          <script>
            console.log('Callback success - posting message to opener');
            let messageSent = false;
            
            function sendSuccessMessage() {
              if (messageSent) return;
              try {
                if (window.opener && !window.opener.closed) {
                  console.log('Sending success message to opener');
                  window.opener.postMessage({ 
                    type: 'twitter-auth-success' 
                  }, '*');
                  messageSent = true;
                  console.log('Success message sent');
                  setTimeout(() => {
                    console.log('Closing window');
                    window.close();
                  }, 1500);
                } else {
                  console.log('No opener window found or opener is closed');
                  setTimeout(() => window.close(), 3000);
                }
              } catch (e) {
                console.error('Error posting success message:', e);
                setTimeout(() => window.close(), 3000);
              }
            }
            
            // Try sending message immediately and with a slight delay
            sendSuccessMessage();
            setTimeout(sendSuccessMessage, 100);
            setTimeout(sendSuccessMessage, 500);
            
            // Fallback: close window after 5 seconds if still open
            setTimeout(() => {
              if (!window.closed) {
                console.log('Force closing window after timeout');
                window.close();
              }
            }, 5000);
          </script>
          <p><button onclick="window.close()">Close Window</button></p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (error) {
    console.error('Twitter callback error:', error);
    const errorMsg = `Authentication failed: ${error.message}`;
    return new Response(`
      <html>
        <head><title>Error</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
          <h1>Error</h1>
          <p style="color: red;">${errorMsg}</p>
          <script>
            console.log('General error - posting message to opener');
            try {
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage({ 
                  type: 'twitter-auth-error', 
                  error: 'Authentication failed' 
                }, '*');
                setTimeout(() => window.close(), 2000);
              } else {
                console.log('No opener window found');
              }
            } catch (e) {
              console.error('Error posting message:', e);
            }
          </script>
          <p><button onclick="window.close()">Close Window</button></p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
});
