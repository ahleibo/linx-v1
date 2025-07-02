
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Get user from auth token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Get Twitter connection
    const { data: connection } = await supabase
      .from('twitter_connections')
      .select('access_token, expires_at')
      .eq('user_id', user.id)
      .single();

    if (!connection || new Date(connection.expires_at) <= new Date()) {
      return new Response(
        JSON.stringify({ error: 'Twitter account not connected or expired' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    console.log('Fetching bookmarks from Twitter API...');
    
    // Fetch bookmarks from Twitter API (using X.com domain) - limit to 20 most recent
    const bookmarksResponse = await fetch(
      'https://api.x.com/2/users/me/bookmarks?' +
      'max_results=20&' +
      'tweet.fields=id,text,author_id,created_at,public_metrics,entities,attachments&' +
      'expansions=author_id,attachments.media_keys&' +
      'user.fields=id,username,name,profile_image_url&' +
      'media.fields=media_key,type,url,preview_image_url,alt_text',
      {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Twitter API response status:', bookmarksResponse.status);

    if (!bookmarksResponse.ok) {
      const errorText = await bookmarksResponse.text();
      console.error('Twitter API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch bookmarks from Twitter' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    const bookmarksData = await bookmarksResponse.json();
    const tweets = bookmarksData.data || [];
    const includes = bookmarksData.includes || {};
    const users = includes.users || [];
    const media = includes.media || [];

    let importedCount = 0;

    // Process each bookmark
    for (const tweet of tweets) {
      try {
        // Find the author
        const author = users.find((u: any) => u.id === tweet.author_id) || {
          id: tweet.author_id,
          username: 'unknown',
          name: 'Unknown User'
        };

        // Process media URLs
        const mediaUrls: string[] = [];
        if (tweet.attachments?.media_keys) {
          tweet.attachments.media_keys.forEach((mediaKey: string) => {
            const mediaItem = media.find((m: any) => m.media_key === mediaKey);
            if (mediaItem?.url || mediaItem?.preview_image_url) {
              mediaUrls.push(mediaItem.url || mediaItem.preview_image_url);
            }
          });
        }

        // Check if post already exists
        const { data: existingPost } = await supabase
          .from('posts')
          .select('id')
          .eq('x_post_id', tweet.id)
          .eq('user_id', user.id)
          .single();

        if (!existingPost) {
          // Insert the post
          const { error: insertError } = await supabase
            .from('posts')
            .insert({
              user_id: user.id,
              x_post_id: tweet.id,
              content: tweet.text,
              author_name: author.name,
              author_username: author.username,
              author_avatar: author.profile_image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=1DA1F2&color=fff&size=48`,
              media_urls: mediaUrls,
              created_at: tweet.created_at,
              likes_count: tweet.public_metrics?.like_count || 0,
              retweets_count: tweet.public_metrics?.retweet_count || 0,
              replies_count: tweet.public_metrics?.reply_count || 0,
              x_url: `https://twitter.com/${author.username}/status/${tweet.id}`,
              import_source: 'twitter_bookmarks'
            });

          if (!insertError) {
            importedCount++;
          }
        }
      } catch (error) {
        console.error('Error processing tweet:', tweet.id, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported: importedCount,
        total: tweets.length 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Import bookmarks error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
