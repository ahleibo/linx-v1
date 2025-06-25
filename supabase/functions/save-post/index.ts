
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

interface PostData {
  xPostId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar?: string;
  content: string;
  mediaUrls?: string[];
  createdAt: string;
  likesCount?: number;
  retweetsCount?: number;
  repliesCount?: number;
  xUrl?: string;
}

serve(async (req) => {
  console.log('Save-post function called with method:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Supabase client with service role key for better permissions
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
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
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    console.log('User authenticated successfully:', user.id);

    // Parse request body
    const postData: PostData = await req.json();
    console.log('Post data received:', {
      xPostId: postData.xPostId,
      authorUsername: postData.authorUsername,
      contentLength: postData.content?.length
    });

    // Check if post already exists for this user
    const { data: existingPost, error: checkError } = await supabase
      .from('posts')
      .select('id, x_post_id')
      .eq('x_post_id', postData.xPostId)
      .eq('user_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking existing post:', checkError);
      return new Response(
        JSON.stringify({ error: 'Database error while checking for existing post' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // If post already exists, return success with existing post
    if (existingPost) {
      console.log('Post already exists:', existingPost.id);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Post already exists in your library',
          post: existingPost,
          isExisting: true 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Prepare post data for insertion
    const insertData = {
      user_id: user.id,
      x_post_id: postData.xPostId,
      content: postData.content,
      author_name: postData.authorName,
      author_username: postData.authorUsername,
      author_avatar: postData.authorAvatar,
      media_urls: postData.mediaUrls || [],
      created_at: postData.createdAt,
      likes_count: postData.likesCount || 0,
      retweets_count: postData.retweetsCount || 0,
      replies_count: postData.repliesCount || 0,
      x_url: postData.xUrl,
      import_source: 'url_import'
    };

    console.log('Inserting post data:', insertData);

    // Insert the post
    const { data: savedPost, error: insertError } = await supabase
      .from('posts')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      // Handle duplicate key error specifically
      if (insertError.code === '23505' && insertError.message?.includes('x_post_id')) {
        console.log('Post already exists (race condition)');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Post already exists in your library',
            isExisting: true 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
      
      console.error('Error saving post:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save post to database' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log('Post saved successfully:', savedPost.id);

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Post saved successfully',
        post: savedPost,
        isNew: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Unexpected error in save-post function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
