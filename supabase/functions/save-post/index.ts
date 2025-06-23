
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SavePostRequest {
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

Deno.serve(async (req) => {
  console.log('Save-post function called with method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create client for user validation
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // First check if user exists in auth
    let userId: string;
    let userEmail: string = '';

    try {
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
      
      if (userError || !user) {
        console.error('User authentication failed:', userError?.message || 'No user found');
        
        // Try to extract user ID from JWT token as fallback
        try {
          const token = authHeader.replace('Bearer ', '');
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.sub;
          userEmail = payload.email || '';
          console.log('Extracted user ID from JWT:', userId);
          
          // Check if this user exists in auth.users using admin client
          const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
          
          if (authUserError || !authUser.user) {
            console.error('User does not exist in auth system:', authUserError?.message);
            return new Response(
              JSON.stringify({ 
                error: 'User session is invalid. Please sign out and sign back in.',
                details: 'Your authentication session has expired or the user account no longer exists.'
              }),
              { 
                status: 401, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }
          
          console.log('User exists in auth system, proceeding with import');
        } catch (jwtError) {
          console.error('Failed to extract user from JWT:', jwtError);
          return new Response(
            JSON.stringify({ 
              error: 'Invalid authentication token. Please sign out and sign back in.',
              details: 'Unable to validate your authentication session.'
            }),
            { 
              status: 401, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }
      } else {
        userId = user.id;
        userEmail = user.email || '';
        console.log('User authenticated successfully:', userId);
      }
    } catch (authError) {
      console.error('Authentication check failed:', authError);
      return new Response(
        JSON.stringify({ 
          error: 'Authentication failed. Please sign out and sign back in.',
          details: 'Unable to verify your authentication session.'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Ensure user profile exists
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
      
    if (profileError && profileError.code === 'PGRST116') {
      console.log('Creating user profile for:', userId);
      const { error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          full_name: 'LiNX User',
          email: userEmail
        });
        
      if (createError) {
        console.error('Error creating user profile:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user profile', details: createError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    } else if (profileError) {
      console.error('Error checking user profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user profile', details: profileError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const postData: SavePostRequest = await req.json()
    console.log('Post data received:', { 
      xPostId: postData.xPostId, 
      authorUsername: postData.authorUsername,
      contentLength: postData.content?.length 
    });

    // Save post using admin client
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: userId,
        x_post_id: postData.xPostId,
        author_name: postData.authorName,
        author_username: postData.authorUsername,
        author_avatar: postData.authorAvatar,
        content: postData.content,
        media_urls: postData.mediaUrls || [],
        created_at: postData.createdAt,
        likes_count: postData.likesCount || 0,
        retweets_count: postData.retweetsCount || 0,
        replies_count: postData.repliesCount || 0,
        x_url: postData.xUrl
      })
      .select()
      .single()

    if (postError) {
      console.error('Error saving post:', postError);
      return new Response(
        JSON.stringify({ error: 'Failed to save post', details: postError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Post saved successfully:', post.id);

    // Mock AI topic clustering
    const topics = await mockTopicClustering(postData.content)
    console.log('Generated topics:', topics);
    
    // Assign topics to post
    for (const topic of topics) {
      const { error: topicError } = await supabaseAdmin
        .from('post_topics')
        .insert({
          post_id: post.id,
          topic_id: topic.topicId,
          confidence_score: topic.confidence,
          is_manual: false
        })
      
      if (topicError) {
        console.error('Error assigning topic:', topicError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        post,
        assignedTopics: topics.length 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in save-post function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function mockTopicClustering(content: string) {
  const contentLower = content.toLowerCase()
  const results = []

  const topicMap = {
    'technology': { id: 'd0bb5d7f-b909-40a0-8949-0175ea87dbb3', confidence: 0.9 },
    'tech': { id: 'd0bb5d7f-b909-40a0-8949-0175ea87dbb3', confidence: 0.85 },
    'coding': { id: 'd0bb5d7f-b909-40a0-8949-0175ea87dbb3', confidence: 0.9 },
    'programming': { id: 'd0bb5d7f-b909-40a0-8949-0175ea87dbb3', confidence: 0.9 },
    'webdev': { id: 'd0bb5d7f-b909-40a0-8949-0175ea87dbb3', confidence: 0.85 },
    'ai': { id: 'd0bb5d7f-b909-40a0-8949-0175ea87dbb3', confidence: 0.95 },
    'sports': { id: '5065368e-dcd6-44a1-99e3-fced44589f6c', confidence: 0.85 },
    'art': { id: 'e9d1bad2-81e1-411b-8cfa-c9f685929879', confidence: 0.8 },
    'design': { id: 'e9d1bad2-81e1-411b-8cfa-c9f685929879', confidence: 0.8 },
    'business': { id: '28ad5e45-05e7-4301-bba2-b570cd424367', confidence: 0.8 },
    'science': { id: 'da170ec8-2c30-4efc-b678-4440933bf81b', confidence: 0.8 },
    'coffee': { id: 'd0bb5d7f-b909-40a0-8949-0175ea87dbb3', confidence: 0.7 },
    'nature': { id: 'da170ec8-2c30-4efc-b678-4440933bf81b', confidence: 0.8 },
    'book': { id: '5f4bcd32-7266-430e-b3d8-d89996aab8ba', confidence: 0.8 },
    'reading': { id: '5f4bcd32-7266-430e-b3d8-d89996aab8ba', confidence: 0.8 }
  }

  for (const [keyword, topic] of Object.entries(topicMap)) {
    if (contentLower.includes(keyword)) {
      results.push({
        topicId: topic.id,
        confidence: topic.confidence
      })
    }
  }

  return results.length > 0 ? results : [{ topicId: 'd0bb5d7f-b909-40a0-8949-0175ea87dbb3', confidence: 0.5 }]
}
