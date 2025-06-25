
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
        JSON.stringify({ 
          error: 'Twitter API not configured', 
          details: 'TWITTER_BEARER_TOKEN secret is missing. Please add it in Supabase Dashboard > Settings > API > Edge Function Secrets.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Validate bearer token format
    if (!bearerToken.startsWith('AAAAAAAAAA')) {
      console.error('Invalid Twitter Bearer Token format');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid Twitter Bearer Token', 
          details: 'The TWITTER_BEARER_TOKEN should start with "AAAAAAAAAA". Please check your token in the Twitter Developer Portal.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log('Bearer token available and valid format');

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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twitter API error response:', response.status, errorText);
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: 'Twitter API authentication failed', 
            details: 'Your TWITTER_BEARER_TOKEN is invalid or expired. Please:\n1. Go to Twitter Developer Portal\n2. Regenerate your Bearer Token\n3. Update the TWITTER_BEARER_TOKEN secret in Supabase\n4. Wait 2 minutes and try again' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 401 
          }
        );
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded', 
            details: 'Twitter API rate limit reached. Please wait 15 minutes before trying again.',
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
          JSON.stringify({ 
            error: 'Access forbidden', 
            details: 'This post is private, restricted, or your Twitter app doesn\'t have the required permissions. Only public posts can be imported.' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403 
          }
        );
      }

      if (response.status === 404) {
        return new Response(
          JSON.stringify({ 
            error: 'Post not found', 
            details: 'The post doesn\'t exist or has been deleted. Please check the URL and try again.' 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404 
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          error: `Twitter API error (${response.status})`, 
          details: errorText,
          status: response.status 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status 
        }
      );
    }

    const twitterData: TwitterApiResponse = await response.json();
    console.log('Twitter API response received successfully');

    if (twitterData.errors && twitterData.errors.length > 0) {
      console.error('Twitter API errors:', twitterData.errors);
      return new Response(
        JSON.stringify({ 
          error: 'Twitter API returned errors', 
          details: twitterData.errors.map(e => e.detail).join('; ') 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    if (!twitterData.data) {
      return new Response(
        JSON.stringify({ 
          error: 'Post not found', 
          details: 'The post is not accessible or doesn\'t exist. Please verify the URL and ensure it\'s a public post.' 
        }),
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
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message || 'An unexpected error occurred. Please try again later.' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
