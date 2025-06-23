
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
    // Log environment variables (without exposing secrets)
    console.log('Environment check - SUPABASE_URL exists:', !!Deno.env.get('SUPABASE_URL'));
    console.log('Environment check - SUPABASE_ANON_KEY exists:', !!Deno.env.get('SUPABASE_ANON_KEY'));
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    console.log('Authorization header:', req.headers.get('Authorization') ? 'Present' : 'Missing');

    // Get the current user
    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser()

    console.log('User lookup result:', { user: user?.id, error: userError });

    if (userError) {
      console.error('User error:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication error', details: userError.message }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!user) {
      console.error('No user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - no user found' }),
        { 
          status: 401, 
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

    // Save post to database
    const { data: post, error: postError } = await supabaseClient
      .from('posts')
      .insert({
        user_id: user.id,
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

    // Mock AI topic clustering (in production, would call actual AI service)
    const topics = await mockTopicClustering(postData.content)
    console.log('Generated topics:', topics);
    
    // Assign topics to post
    for (const topic of topics) {
      const { error: topicError } = await supabaseClient
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
  // Mock AI clustering logic
  const contentLower = content.toLowerCase()
  const results = []

  // Enhanced topic detection
  const topicMap = {
    'technology': { id: '1', confidence: 0.9 },
    'tech': { id: '1', confidence: 0.85 },
    'coding': { id: '1', confidence: 0.9 },
    'programming': { id: '1', confidence: 0.9 },
    'webdev': { id: '1', confidence: 0.85 },
    'ai': { id: '1', confidence: 0.95 },
    'sports': { id: '2', confidence: 0.85 },
    'art': { id: '3', confidence: 0.8 },
    'design': { id: '3', confidence: 0.8 },
    'business': { id: '4', confidence: 0.8 },
    'science': { id: '5', confidence: 0.8 },
    'coffee': { id: '6', confidence: 0.7 },
    'nature': { id: '7', confidence: 0.8 },
    'book': { id: '8', confidence: 0.8 },
    'reading': { id: '8', confidence: 0.8 }
  }

  for (const [keyword, topic] of Object.entries(topicMap)) {
    if (contentLower.includes(keyword)) {
      results.push({
        topicId: topic.id,
        confidence: topic.confidence
      })
    }
  }

  return results.length > 0 ? results : [{ topicId: '1', confidence: 0.5 }]
}
