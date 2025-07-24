
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

    // Get pagination state
    console.log('Getting pagination state...');
    const { data: paginationState, error: paginationError } = await supabase
      .from('import_pagination')
      .select('next_token')
      .eq('user_id', user.id)
      .eq('import_type', 'twitter_bookmarks')
      .single();

    console.log('Pagination state:', { 
      hasState: !!paginationState, 
      hasToken: !!paginationState?.next_token,
      error: paginationError?.message 
    });

    console.log('Fetching user info from Twitter API first...');

    // First, get the authenticated user's info to get their Twitter ID
    const userResponse = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      const userErrorText = await userResponse.text();
      console.error('Failed to get user info:', {
        status: userResponse.status,
        statusText: userResponse.statusText,
        body: userErrorText
      });
      return new Response(
        JSON.stringify({ 
          error: `Failed to authenticate with Twitter: ${userResponse.status} - ${userResponse.statusText}`,
          details: userErrorText
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: userResponse.status 
        }
      );
    }

    const userData = await userResponse.json();
    const twitterUserId = userData.data.id;
    console.log('Got Twitter user ID:', twitterUserId);

    console.log('Fetching bookmarks from Twitter API...');

    // Build URL with pagination token if available
    let bookmarksUrl = `https://api.twitter.com/2/users/${twitterUserId}/bookmarks?` +
      'max_results=5&' +  // Reduced to 5 to minimize rate limit impact
      'tweet.fields=id,text,author_id,created_at,public_metrics,entities,attachments&' +
      'expansions=author_id,attachments.media_keys&' +
      'user.fields=id,username,name,profile_image_url&' +
      'media.fields=media_key,type,url,preview_image_url,alt_text';

    // Add pagination token if we have one (skip errors as it might be first import)
    if (paginationState?.next_token) {
      bookmarksUrl += `&pagination_token=${paginationState.next_token}`;
      console.log('Using pagination token for next batch');
    } else {
      console.log('No pagination token - fetching most recent bookmarks');
    }

    // Now fetch bookmarks using the correct endpoint with user ID
    const bookmarksResponse = await fetch(bookmarksUrl, {
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Twitter API response status:', bookmarksResponse.status);
    console.log('Twitter API response headers:', Object.fromEntries(bookmarksResponse.headers.entries()));

    if (!bookmarksResponse.ok) {
      const errorText = await bookmarksResponse.text();
      console.error('Twitter API error:', {
        status: bookmarksResponse.status,
        statusText: bookmarksResponse.statusText,
        body: errorText
      });
      
      // Handle rate limiting specifically
      if (bookmarksResponse.status === 429) {
        const resetHeader = bookmarksResponse.headers.get('x-rate-limit-reset');
        const resetTime = resetHeader ? new Date(parseInt(resetHeader) * 1000) : null;
        const waitTime = resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 1000 / 60) : 15;
        
        return new Response(
          JSON.stringify({ 
            error: `Twitter API rate limit exceeded. Please wait ${waitTime} minutes before trying again.`,
            details: 'Twitter limits bookmark requests. Try again later.',
            rateLimited: true,
            waitMinutes: waitTime
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429 
          }
        );
      }
      
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

    // Save pagination state for next import
    const nextToken = bookmarksData.meta?.next_token;
    console.log('Saving pagination state, next_token:', nextToken);
    
    if (nextToken || paginationState) {
      const { error: paginationSaveError } = await supabase
        .from('import_pagination')
        .upsert({
          user_id: user.id,
          import_type: 'twitter_bookmarks',
          next_token: nextToken, // Will be null if no more pages
          last_imported_at: new Date().toISOString()
        });

      if (paginationSaveError) {
        console.error('Error saving pagination state:', paginationSaveError);
      } else {
        console.log('Pagination state saved successfully');
      }
    }

    console.log('Import completed:', {
      total: tweets.length,
      imported: importedCount,
      skipped: skippedCount,
      errors: errors.length,
      hasMorePages: !!nextToken
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        imported: importedCount,
        skipped: skippedCount,
        total: tweets.length,
        hasMorePages: !!nextToken,
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
