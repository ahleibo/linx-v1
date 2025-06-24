
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

    if (error) {
      console.error('Twitter OAuth error:', error);
      return new Response(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'twitter-auth-error', error: '${error}' }, '*');
                window.close();
              } else {
                document.body.innerHTML = '<h1>Authentication Error</h1><p>${error}</p>';
              }
            </script>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    if (!code || !state) {
      console.error('Missing required parameters:', { code: !!code, state: !!state });
      return new Response(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'twitter-auth-error', error: 'Missing required parameters' }, '*');
                window.close();
              } else {
                document.body.innerHTML = '<h1>Authentication Error</h1><p>Missing required parameters</p>';
              }
            </script>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get stored auth session
    const { data: authSession, error: sessionError } = await supabase
      .from('twitter_auth_sessions')
      .select('user_id, code_verifier')
      .eq('state', state)
      .single();

    if (sessionError || !authSession) {
      console.error('Invalid or expired auth session:', sessionError);
      return new Response(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'twitter-auth-error', error: 'Invalid or expired auth session' }, '*');
                window.close();
              } else {
                document.body.innerHTML = '<h1>Authentication Error</h1><p>Invalid or expired auth session</p>';
              }
            </script>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    const userId = authSession.user_id;
    const codeVerifier = authSession.code_verifier;
    console.log('Retrieved auth session for user:', userId);
    
    // Exchange code for access token using OAuth 2.0
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
      return new Response(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'twitter-auth-error', error: 'Server configuration error' }, '*');
                window.close();
              } else {
                document.body.innerHTML = '<h1>Server Error</h1><p>Twitter credentials not configured</p>';
              }
            </script>
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
      return new Response(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'twitter-auth-error', error: 'Token exchange failed: ${responseText}' }, '*');
                window.close();
              } else {
                document.body.innerHTML = '<h1>Authentication Error</h1><p>Token exchange failed</p><pre>${responseText}</pre>';
              }
            </script>
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
      return new Response(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'twitter-auth-error', error: 'Failed to save connection' }, '*');
                window.close();
              } else {
                document.body.innerHTML = '<h1>Database Error</h1><p>Failed to save connection</p>';
              }
            </script>
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
        <body>
          <script>
            console.log('Callback success - posting message to opener');
            if (window.opener) {
              window.opener.postMessage({ type: 'twitter-auth-success' }, '*');
              setTimeout(() => window.close(), 1000);
            } else {
              document.body.innerHTML = '<h1>Success!</h1><p>Authentication successful! You can close this window.</p>';
            }
          </script>
          <h1>Success!</h1>
          <p>Authentication successful! You can close this window.</p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });

  } catch (error) {
    console.error('Twitter callback error:', error);
    return new Response(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'twitter-auth-error', error: 'Authentication failed: ${error.message}' }, '*');
              window.close();
            } else {
              document.body.innerHTML = '<h1>Error</h1><p>Authentication failed: ${error.message}</p>';
            }
          </script>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
});
