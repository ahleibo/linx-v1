
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
              window.opener.postMessage({ type: 'twitter-auth-error', error: '${error}' }, '*');
              window.close();
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
              window.opener.postMessage({ type: 'twitter-auth-error', error: 'Missing required parameters' }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    // Extract user ID from state
    const userId = state.split('_')[0];
    console.log('Extracted user ID:', userId);
    
    // Exchange code for access token
    const clientId = Deno.env.get('TWITTER_CLIENT_ID');
    const clientSecret = Deno.env.get('TWITTER_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/twitter-callback`;

    console.log('Token exchange details:', { 
      clientId: !!clientId, 
      clientSecret: !!clientSecret, 
      redirectUri 
    });

    if (!clientId || !clientSecret) {
      console.error('Missing Twitter credentials');
      return new Response(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'twitter-auth-error', error: 'Server configuration error' }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        code_verifier: 'challenge', // Twitter OAuth 2.0 requires this
      })
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
              window.opener.postMessage({ type: 'twitter-auth-error', error: 'Token exchange failed' }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    const tokenData = JSON.parse(responseText);
    console.log('Token data received:', Object.keys(tokenData));
    
    // Store tokens in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
              window.opener.postMessage({ type: 'twitter-auth-error', error: 'Failed to save connection' }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    console.log('Twitter connection saved successfully');

    // Return success page that communicates with parent window
    return new Response(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'twitter-auth-success' }, '*');
            window.close();
          </script>
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
            window.opener.postMessage({ type: 'twitter-auth-error', error: 'Authentication failed' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
});
