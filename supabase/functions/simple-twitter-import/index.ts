
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Get Twitter connection
    const { data: connection, error: connectionError } = await supabase
      .from('twitter_connections')
      .select('access_token')
      .eq('user_id', user.id)
      .single();

    if (connectionError || !connection) {
      return new Response(
        JSON.stringify({ error: 'Twitter not connected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch bookmarks from Twitter
    const bookmarksResponse = await fetch(
      'https://api.twitter.com/2/users/me/bookmarks?tweet.fields=id,text,author_id,created_at&expansions=author_id&user.fields=username,name,profile_image_url',
      {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`
        }
      }
    );

    if (!bookmarksResponse.ok) {
      const errorText = await bookmarksResponse.text();
      console.error('Bookmarks fetch failed:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch bookmarks' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const bookmarksData = await bookmarksResponse.json();
    const tweets = bookmarksData.data || [];
    const users = bookmarksData.includes?.users || [];

    let imported = 0;

    // Import each tweet
    for (const tweet of tweets) {
      try {
        const author = users.find((u: any) => u.id === tweet.author_id) || {
          username: 'unknown',
          name: 'Unknown User'
        };

        // Check if already exists
        const { data: existing } = await supabase
          .from('posts')
          .select('id')
          .eq('x_post_id', tweet.id)
          .eq('user_id', user.id)
          .single();

        if (!existing) {
          const { error: insertError } = await supabase
            .from('posts')
            .insert({
              user_id: user.id,
              x_post_id: tweet.id,
              content: tweet.text,
              author_name: author.name,
              author_username: author.username,
              author_avatar: author.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=1DA1F2&color=fff&size=48`,
              created_at: tweet.created_at,
              x_url: `https://twitter.com/${author.username}/status/${tweet.id}`,
              import_source: 'twitter_bookmarks'
            });

          if (!insertError) {
            imported++;
          }
        }
      } catch (error) {
        console.error('Error importing tweet:', tweet.id, error);
      }
    }

    return new Response(
      JSON.stringify({ imported, total: tweets.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
