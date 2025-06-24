
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  console.log('Check Twitter connection function called');
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
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

    // Get user from auth token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token', connected: false }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    console.log('User authenticated:', user.id);

    // Check if user has a Twitter connection
    const { data: connection, error: connectionError } = await supabase
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
    
    return new Response(
      JSON.stringify({ connected: !isExpired }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Check connection error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', connected: false }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
