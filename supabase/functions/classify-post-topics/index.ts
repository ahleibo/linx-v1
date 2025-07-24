import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  console.log('=== CLASSIFY POST TOPICS FUNCTION STARTED ===');

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

    const { postId } = await req.json();
    
    if (!postId) {
      return new Response(
        JSON.stringify({ error: 'Post ID is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    console.log('Classifying topics for post:', postId);

    // Get the post content
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('content, author_name, author_username')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single();

    if (postError || !post) {
      return new Response(
        JSON.stringify({ error: 'Post not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    // Get available topics
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('id, name, description');

    if (topicsError) {
      console.error('Error fetching topics:', topicsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch topics' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Prepare prompt for Gemini
    const topicsList = topics.map(t => `- ${t.name}: ${t.description || 'No description'}`).join('\n');
    
    const prompt = `
You are a content classifier. Analyze the following social media post and classify it into the most relevant topics from the provided list.

Post Content: "${post.content}"
Author: @${post.author_username} (${post.author_name})

Available Topics:
${topicsList}

Instructions:
1. Select 1-3 most relevant topics that best describe the post content
2. Consider the main themes, keywords, and context
3. Respond with ONLY a JSON array of topic names (exactly as listed above)
4. If no topics are relevant, respond with an empty array []

Example response: ["Technology", "Art & Design"]

Response:`;

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
          temperature: 0.1,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 100,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to classify topics' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    const geminiResult = await geminiResponse.json();
    console.log('Gemini response:', geminiResult);

    let classifiedTopics: string[] = [];
    try {
      const responseText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      console.log('Raw response text:', responseText);
      
      // Clean the response text and extract JSON
      const cleanedText = responseText.trim().replace(/```json\n?|\n?```/g, '');
      classifiedTopics = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      // Fallback: try to extract topic names from text
      const responseText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const topicNames = topics.map(t => t.name);
      classifiedTopics = topicNames.filter(name => 
        responseText.toLowerCase().includes(name.toLowerCase())
      );
    }

    console.log('Classified topics:', classifiedTopics);

    // Convert topic names to IDs and save associations
    if (classifiedTopics.length > 0) {
      const topicIds = topics
        .filter(t => classifiedTopics.includes(t.name))
        .map(t => t.id);

      // Remove existing topic associations for this post
      await supabase
        .from('post_topics')
        .delete()
        .eq('post_id', postId);

      // Add new topic associations
      const postTopicInserts = topicIds.map(topicId => ({
        post_id: postId,
        topic_id: topicId,
        confidence_score: 0.9,
        is_manual: false
      }));

      const { error: insertError } = await supabase
        .from('post_topics')
        .insert(postTopicInserts);

      if (insertError) {
        console.error('Error inserting post topics:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save topic classifications' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500 
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        classifiedTopics,
        topicCount: classifiedTopics.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('=== CLASSIFY POST TOPICS FUNCTION ERROR ===');
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