
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatRequest {
  query: string;
  context?: 'posts' | 'topics' | 'general';
}

Deno.serve(async (req) => {
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

    const { query, context = 'general' }: ChatRequest = await req.json()

    // Get user's posts for context
    const { data: posts } = await supabaseClient
      .from('posts')
      .select(`
        *,
        post_topics (
          topics (
            name,
            color
          )
        )
      `)
      .eq('user_id', user.id)
      .limit(50)

    // Mock AI processing (in production, would use OpenAI/Claude/etc.)
    const response = await processChatQuery(query, posts || [], context)

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in ai-chat function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function processChatQuery(query: string, posts: any[], context: string) {
  const queryLower = query.toLowerCase()
  
  // Mock intelligent responses based on query
  if (queryLower.includes('summarize') && queryLower.includes('sports')) {
    const sportsPosts = posts.filter(post => 
      post.post_topics?.some((pt: any) => pt.topics?.name === 'Sports')
    )
    
    return {
      message: `I found ${sportsPosts.length} sports-related posts in your collection. Recent highlights include discussions about player performances, game statistics, and sports industry trends. Your sports content focuses primarily on basketball and general athletics.`,
      type: 'summary',
      relatedPosts: sportsPosts.slice(0, 5),
      postCount: sportsPosts.length
    }
  }
  
  if (queryLower.includes('lebron') || queryLower.includes('james')) {
    const lebronPosts = posts.filter(post => 
      post.content.toLowerCase().includes('lebron') || 
      post.content.toLowerCase().includes('james')
    )
    
    return {
      message: `Found ${lebronPosts.length} posts mentioning LeBron James. The content discusses his current season performance, career achievements, and impact on basketball. Key themes include his consistency and leadership.`,
      type: 'search',
      relatedPosts: lebronPosts,
      searchTerm: 'LeBron James'
    }
  }
  
  if (queryLower.includes('tech') || queryLower.includes('ai')) {
    const techPosts = posts.filter(post => 
      post.post_topics?.some((pt: any) => pt.topics?.name === 'Technology')
    )
    
    return {
      message: `Your technology collection contains ${techPosts.length} posts covering AI breakthroughs, software development, and innovation trends. Recent topics include machine learning applications and personal knowledge management tools.`,
      type: 'summary',
      relatedPosts: techPosts.slice(0, 5),
      postCount: techPosts.length
    }
  }
  
  // General search
  const matchingPosts = posts.filter(post =>
    post.content.toLowerCase().includes(queryLower) ||
    post.author_name.toLowerCase().includes(queryLower)
  )
  
  return {
    message: `I found ${matchingPosts.length} posts related to "${query}". Here's what I discovered in your saved content.`,
    type: 'search',
    relatedPosts: matchingPosts.slice(0, 10),
    searchTerm: query
  }
}
