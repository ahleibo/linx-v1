
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

interface TwitterApiError {
  title: string;
  detail: string;
  type: string;
}

interface TwitterApiResponse {
  data?: any;
  includes?: {
    users?: any[];
    tweets?: any[];
    media?: any[];
  };
  errors?: TwitterApiError[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tweetId, url } = await req.json();

    if (!tweetId) {
      return new Response(
        JSON.stringify({ error: 'Tweet ID is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log('Fetching tweet with ID:', tweetId);

    // Get Twitter Bearer Token from environment
    const bearerToken = Deno.env.get('TWITTER_BEARER_TOKEN');
    if (!bearerToken) {
      console.error('Twitter Bearer Token not configured');
      return new Response(
        JSON.stringify({ error: 'Twitter API authentication not configured. Please set TWITTER_BEARER_TOKEN secret.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log('Bearer token available:', !!bearerToken);
    console.log('Bearer token length:', bearerToken.length);

    // Twitter API v2 endpoint with expansions for complete data
    const twitterUrl = new URL(`https://api.twitter.com/2/tweets/${tweetId}`);
    twitterUrl.searchParams.set('tweet.fields', [
      'id',
      'text',
      'author_id',
      'created_at',
      'conversation_id',
      'in_reply_to_user_id',
      'referenced_tweets',
      'public_metrics',
      'entities',
      'context_annotations',
      'lang',
      'possibly_sensitive',
      'source'
    ].join(','));
    
    twitterUrl.searchParams.set('expansions', [
      'author_id',
      'referenced_tweets.id',
      'referenced_tweets.id.author_id',
      'attachments.media_keys'
    ].join(','));
    
    twitterUrl.searchParams.set('user.fields', [
      'id',
      'username',
      'name',
      'description',
      'profile_image_url',
      'verified',
      'verified_type',
      'public_metrics'
    ].join(','));
    
    twitterUrl.searchParams.set('media.fields', [
      'media_key',
      'type',
      'url',
      'preview_image_url',
      'alt_text',
      'width',
      'height',
      'duration_ms',
      'public_metrics'
    ].join(','));

    console.log('Making request to Twitter API:', twitterUrl.toString());

    // Make request to Twitter API
    const response = await fetch(twitterUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'LiNX-v2.0'
      },
    });

    console.log('Twitter API response status:', response.status);
    console.log('Twitter API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twitter API error response:', response.status, errorText);
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Twitter API authentication failed. Please check if TWITTER_BEARER_TOKEN is valid and has the correct permissions.' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401 
          }
        );
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Twitter API rate limit exceeded. Please try again in a few minutes.',
            rateLimited: true 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429 
          }
        );
      }

      if (response.status === 403) {
        return new Response(
          JSON.stringify({ error: 'This post is private or restricted. Only public posts can be imported.' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403 
          }
        );
      }

      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: 'Post not found. Please check the URL and try again.' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404 
          }
        );
      }

      return new Response(
        JSON.stringify({ error: `Twitter API error (${response.status}): ${errorText}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status 
        }
      );
    }

    const twitterData: TwitterApiResponse = await response.json();
    console.log('Twitter API response received successfully:', JSON.stringify(twitterData, null, 2));

    if (twitterData.errors && twitterData.errors.length > 0) {
      console.error('Twitter API errors:', twitterData.errors);
      return new Response(
        JSON.stringify({ error: twitterData.errors[0].detail || 'Twitter API error occurred' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    if (!twitterData.data) {
      return new Response(
        JSON.stringify({ error: 'Post not found or not accessible. Please verify the URL.' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    // Return the complete Twitter API response
    return new Response(
      JSON.stringify(twitterData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error. Please try again later.' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
