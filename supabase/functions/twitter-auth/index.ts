import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

// Generate a random string for PKCE code verifier
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Generate SHA256 hash for PKCE code challenge
async function generateCodeChallenge(verifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

serve(async (req) => {
  console.log('=== TWITTER AUTH FUNCTION STARTED ===');
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Supabase configuration
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log('Supabase URL:', supabaseUrl);
    console.log('Anon key available:', !!supabaseAnonKey);
    console.log('Service key available:', !!supabaseServiceKey);

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Extract token from Bearer header
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted successfully');

    // Create supabase client with the user's token
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get user from auth token
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('User lookup result:', { 
      found: !!user, 
      userId: user?.id, 
      error: authError?.message 
    });

    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    console.log('User authenticated successfully:', user.id);

    // Get Twitter API credentials
    const clientId = Deno.env.get('TWITTER_CLIENT_ID');
    const clientSecret = Deno.env.get('TWITTER_CLIENT_SECRET');
    
    console.log('Twitter credentials check:', { 
      clientId: clientId ? 'present' : 'missing', 
      clientSecret: clientSecret ? 'present' : 'missing' 
    });
    
    if (!clientId || !clientSecret) {
      console.error('Missing Twitter API credentials');
      return new Response(
        JSON.stringify({ error: 'Twitter API credentials not configured' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Generate OAuth URL for Twitter with proper PKCE
    const redirectUri = `${supabaseUrl}/functions/v1/twitter-callback`;
    const state = `${user.id}_${Date.now()}`;
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    console.log('OAuth parameters:', { 
      redirectUri,
      state, 
      codeVerifier: 'generated', 
      codeChallenge: 'generated' 
    });
    
    // Use service role key for database operations
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Store code verifier in database for later verification
    console.log('Storing auth session in database...');
    const { error: storeError } = await adminSupabase
      .from('twitter_auth_sessions')
      .upsert({
        user_id: user.id,
        state: state,
        code_verifier: codeVerifier,
        created_at: new Date().toISOString()
      });

    if (storeError) {
      console.error('Failed to store auth session:', storeError);
      return new Response(
        JSON.stringify({ error: 'Failed to store auth session' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    
    console.log('Auth session stored successfully');
    
    // Twitter OAuth 2.0 with proper PKCE
    const authUrl = `https://twitter.com/i/oauth2/authorize?` + 
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent('tweet.read users.read bookmark.read offline.access')}&` +
      `state=${state}&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=S256`;

    console.log('Generated Twitter OAuth URL');
    console.log('Auth URL:', authUrl);
    console.log('=== TWITTER AUTH FUNCTION COMPLETED ===');

    return new Response(
      JSON.stringify({ authUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('=== TWITTER AUTH ERROR ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});