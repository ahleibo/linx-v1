
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  console.log('=== CHECK TWITTER CONNECTION STARTED ===');
  console.log('Request method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Supabase client with anon key for user validation
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log('Supabase URL:', supabaseUrl);
    console.log('Anon key available:', !!supabaseAnonKey);

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header found:', !!authHeader);
    
    if (!authHeader) {
      console.error('No authorization header found');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header', connected: false }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Extract token from Bearer header
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted:', !!token);

    // Get user from auth token using the anon client
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    console.log('User lookup result:', { 
      found: !!user, 
      userId: user?.id, 
      error: authError?.message 
    });

    if (authError || !user) {
      console.error('Authentication failed:', authError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token', connected: false }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    console.log('User authenticated:', user.id);

    // Use service role key for database queries
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Service key available:', !!supabaseServiceKey);

    // Check if user has a Twitter connection
    console.log('Checking Twitter connection for user:', user.id);
    const { data: connection, error: connectionError } = await adminSupabase
      .from('twitter_connections')
      .select('id, expires_at')
      .eq('user_id', user.id)
      .single();

    if (connectionError) {
      console.log('No Twitter connection found:', connectionError.message);
      return new Response(
        JSON.stringify({ connected: false }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Check if token is expired
    const isExpired = connection.expires_at && new Date(connection.expires_at) < new Date();
    console.log('Connection status:', { 
      found: !!connection, 
      expired: isExpired,
      expiresAt: connection.expires_at 
    });
    
    return new Response(
      JSON.stringify({ connected: !isExpired }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('=== CHECK CONNECTION ERROR ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    return new Response(
      JSON.stringify({ error: 'Internal server error', connected: false }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
