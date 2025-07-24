import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('=== AI CHAT POSTS FUNCTION STARTED ===');

  try {
    // Get Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    
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

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    const { question, searchTerms } = await req.json();
    
    if (!question) {
      return new Response(
        JSON.stringify({ error: 'Question is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log('Processing question:', question);

    // Get user's posts with semantic search if search terms provided
    let postsQuery = supabase
      .from('posts')
      .select(`
        id,
        content,
        author_name,
        author_username,
        created_at,
        x_url,
        post_topics(
          topics(name, color)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // If search terms provided, filter posts
    if (searchTerms && searchTerms.length > 0) {
      // Create a search filter for content matching any of the search terms
      const searchFilter = searchTerms
        .map((term: string) => `content.ilike.%${term}%`)
        .join(',');
      postsQuery = postsQuery.or(searchFilter);
    }

    const { data: posts, error: postsError } = await postsQuery.limit(20);

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch posts' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({ 
          answer: "I don't have any posts to analyze yet. Please import some posts first to ask questions about them.",
          sources: []
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Prepare context from posts
    const postsContext = posts.map((post, index) => {
      const topics = post.post_topics?.map((pt: any) => pt.topics?.name).filter(Boolean).join(', ') || 'No topics';
      return `[${index + 1}] Post by @${post.author_username} (${post.author_name}):
Content: "${post.content}"
Topics: ${topics}
Date: ${new Date(post.created_at).toLocaleDateString()}
URL: ${post.x_url}`;
    }).join('\n\n');

    // Prepare prompt for Gemini
    const prompt = `
You are an AI assistant that helps users understand their saved social media posts. Be concise and direct - keep responses to 2-3 sentences unless specifically asked for more detail.

User's Question: "${question}"

Available Posts Context:
${postsContext}

Instructions:
1. Analyze the user's question and provide a brief, focused answer
2. Include specific references to relevant posts by their number [1], [2], etc.
3. Keep your response concise - maximum 2-3 sentences
4. Focus on the most important insights only
5. If the question cannot be answered from available posts, briefly explain what's missing

Answer:`;

    // Call Gemini API
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 300,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to process question' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    const geminiResult = await geminiResponse.json();
    console.log('Gemini response received');

    const answer = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate an answer.';

    // Extract referenced post numbers from the answer and create sources
    const referencedPosts: any[] = [];
    const referencePattern = /\[(\d+)\]/g;
    let match;
    
    while ((match = referencePattern.exec(answer)) !== null) {
      const postIndex = parseInt(match[1]) - 1;
      if (postIndex >= 0 && postIndex < posts.length) {
        const post = posts[postIndex];
        if (!referencedPosts.find(p => p.id === post.id)) {
          referencedPosts.push({
            id: post.id,
            author: `@${post.author_username}`,
            content: post.content.substring(0, 150) + (post.content.length > 150 ? '...' : ''),
            url: post.x_url,
            date: new Date(post.created_at).toLocaleDateString()
          });
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        answer,
        sources: referencedPosts,
        totalPosts: posts.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('=== AI CHAT POSTS FUNCTION ERROR ===');
    console.error('Error details:', error);
    
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