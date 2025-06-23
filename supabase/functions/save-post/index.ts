
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const postData: SavePostRequest = await req.json()

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
      console.error('Error saving post:', postError)
      return new Response(
        JSON.stringify({ error: 'Failed to save post' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Mock AI topic clustering (in production, would call actual AI service)
    const topics = await mockTopicClustering(postData.content)
    
    // Assign topics to post
    for (const topic of topics) {
      await supabaseClient
        .from('post_topics')
        .insert({
          post_id: post.id,
          topic_id: topic.topicId,
          confidence_score: topic.confidence,
          is_manual: false
        })
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
    console.error('Error in save-post function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
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

  // Get topics from database would be better, but for demo purposes:
  const topicMap = {
    'technology': { id: '1', confidence: 0.9 },
    'sports': { id: '2', confidence: 0.85 },
    'art': { id: '3', confidence: 0.8 },
    'business': { id: '4', confidence: 0.8 },
    'science': { id: '5', confidence: 0.8 }
  }

  for (const [keyword, topic] of Object.entries(topicMap)) {
    if (contentLower.includes(keyword) || contentLower.includes(keyword.slice(0, -1))) {
      results.push({
        topicId: topic.id,
        confidence: topic.confidence
      })
    }
  }

  return results.length > 0 ? results : [{ topicId: '1', confidence: 0.5 }]
}
