
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('=== IMPORT BOOKMARKS FUNCTION STARTED ===');

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('Supabase client created successfully');

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Get user from auth token
    const token = authHeader.replace('Bearer ', '');
    console.log('Extracting user from token...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log('User extraction result:', { hasUser: !!user, error: authError?.message });

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    console.log('User authenticated:', user.id);

    // Get Twitter connection
    console.log('Fetching Twitter connection for user:', user.id);
    const { data: connection, error: connectionError } = await supabase
      .from('twitter_connections')
      .select('access_token, expires_at')
      .eq('user_id', user.id)
      .single();

    console.log('Twitter connection query result:', { 
      hasConnection: !!connection, 
      error: connectionError?.message 
    });

    if (connectionError || !connection) {
      console.error('No Twitter connection found:', connectionError);
      return new Response(
        JSON.stringify({ error: 'Twitter account not connected' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    // Check if connection is expired
    if (new Date(connection.expires_at) <= new Date()) {
      console.log('Twitter connection expired');
      return new Response(
        JSON.stringify({ error: 'Twitter connection expired. Please reconnect your account.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    console.log('Twitter connection valid, fetching bookmarks...');

    // Fetch bookmarks from Twitter API
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
    console.log('Twitter API response headers:', Object.fromEntries(bookmarksResponse.headers.entries()));

    if (!bookmarksResponse.ok) {
      const errorText = await bookmarksResponse.text();
      console.error('Twitter API error:', {
        status: bookmarksResponse.status,
        statusText: bookmarksResponse.statusText,
        body: errorText
      });
      
      return new Response(
        JSON.stringify({ 
          error: `Twitter API error: ${bookmarksResponse.status} - ${bookmarksResponse.statusText}`,
          details: errorText
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 502 
        }
      );
    }

    const bookmarksData = await bookmarksResponse.json();
    console.log('Bookmarks data received:', {
      hasTweets: !!(bookmarksData.data),
      tweetCount: bookmarksData.data?.length || 0,
      hasIncludes: !!(bookmarksData.includes)
    });

    const tweets = bookmarksData.data || [];
    const includes = bookmarksData.includes || {};
    const users = includes.users || [];
    const media = includes.media || [];

    console.log('Processing', tweets.length, 'tweets');

    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Process each bookmark
    for (const tweet of tweets) {
      try {
        console.log('Processing tweet:', tweet.id);
        
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
        const { data: existingPost, error: existingError } = await supabase
          .from('posts')
          .select('id')
          .eq('x_post_id', tweet.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingError) {
          console.error('Error checking existing post:', existingError);
          errors.push(`Error checking post ${tweet.id}: ${existingError.message}`);
          continue;
        }

        if (existingPost) {
          console.log('Post already exists:', tweet.id);
          skippedCount++;
          continue;
        }

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

        if (insertError) {
          console.error('Error inserting post:', tweet.id, insertError);
          errors.push(`Error inserting post ${tweet.id}: ${insertError.message}`);
        } else {
          console.log('Successfully imported tweet:', tweet.id);
          importedCount++;
        }
      } catch (error) {
        console.error('Error processing tweet:', tweet.id, error);
        errors.push(`Error processing tweet ${tweet.id}: ${error.message}`);
      }
    }

    console.log('Import completed:', {
      total: tweets.length,
      imported: importedCount,
      skipped: skippedCount,
      errors: errors.length
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported: importedCount,
        skipped: skippedCount,
        total: tweets.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('=== IMPORT BOOKMARKS FUNCTION ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
