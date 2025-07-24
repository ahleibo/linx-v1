
import { supabase } from '@/integrations/supabase/client';

// Mock AI service for topic clustering and chat functionality
// In production, this would integrate with OpenAI, Anthropic, or other LLM providers

export interface TopicClusterResult {
  topicId: string;
  confidence: number;
}

export interface ChatResponse {
  message: string;
  type: 'summary' | 'search' | 'question';
  relatedPosts?: any[];
}

export class AiService {
  // Classify topics for a specific post using Gemini
  static async classifyPostTopics(postId: string): Promise<{ success: boolean; error?: string; classifiedTopics?: string[] }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase.functions.invoke('classify-post-topics', {
        body: { postId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        classifiedTopics: data.classifiedTopics || []
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to classify topics' };
    }
  }

  // Batch classify all posts without topics
  static async batchClassifyAllPosts(): Promise<{ success: boolean; error?: string; processed?: number }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get all posts without topics
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          post_topics(id)
        `)
        .eq('user_id', session.user.id)
        .is('post_topics.id', null);

      if (postsError) {
        return { success: false, error: 'Failed to fetch posts' };
      }

      if (!posts || posts.length === 0) {
        return { success: true, processed: 0 };
      }

      // Process posts in batches to avoid overwhelming the API
      const batchSize = 5;
      let processed = 0;
      
      for (let i = 0; i < posts.length; i += batchSize) {
        const batch = posts.slice(i, i + batchSize);
        
        // Process batch in parallel
        const promises = batch.map(post => this.classifyPostTopics(post.id));
        const results = await Promise.allSettled(promises);
        
        // Count successful classifications
        results.forEach(result => {
          if (result.status === 'fulfilled' && result.value.success) {
            processed++;
          }
        });

        // Add delay between batches to respect rate limits
        if (i + batchSize < posts.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return { success: true, processed };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to batch classify posts' };
    }
  }

  // Ask questions about posts using Gemini
  static async askQuestion(question: string, searchTerms?: string[]): Promise<{ 
    success: boolean; 
    error?: string; 
    answer?: string; 
    sources?: any[];
  }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase.functions.invoke('ai-chat-posts', {
        body: { question, searchTerms },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        answer: data.answer,
        sources: data.sources || []
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to process question' };
    }
  }
}

// Legacy mock service for backwards compatibility
export const aiService = {
  // Mock topic clustering for posts
  async clusterPostTopics(content: string, authorName: string): Promise<TopicClusterResult[]> {
    // Mock logic - in production would use LLM API
    const topics = await this.getAvailableTopics();
    const results: TopicClusterResult[] = [];

    // Simple keyword matching for demo
    const contentLower = content.toLowerCase();
    
    if (contentLower.includes('tech') || contentLower.includes('ai') || contentLower.includes('software')) {
      const techTopic = topics.find(t => t.name === 'Technology');
      if (techTopic) results.push({ topicId: techTopic.id, confidence: 0.9 });
    }
    
    if (contentLower.includes('sport') || contentLower.includes('game') || contentLower.includes('player')) {
      const sportsTopic = topics.find(t => t.name === 'Sports');
      if (sportsTopic) results.push({ topicId: sportsTopic.id, confidence: 0.85 });
    }
    
    if (contentLower.includes('art') || contentLower.includes('design') || contentLower.includes('creative')) {
      const artTopic = topics.find(t => t.name === 'Art & Design');
      if (artTopic) results.push({ topicId: artTopic.id, confidence: 0.8 });
    }
    
    if (contentLower.includes('business') || contentLower.includes('entrepreneur') || contentLower.includes('finance')) {
      const businessTopic = topics.find(t => t.name === 'Business');
      if (businessTopic) results.push({ topicId: businessTopic.id, confidence: 0.8 });
    }

    return results.length > 0 ? results : [{ topicId: topics[0]?.id || '', confidence: 0.5 }];
  },

  // Mock chat/query functionality
  async processQuery(query: string): Promise<ChatResponse> {
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('summarize') && queryLower.includes('sports')) {
      return {
        message: "Here's a summary of your recent sports posts: LeBron James continues his stellar performance this season with consistent elite-level stats. The Lakers are showing improved team chemistry. Recent discussions also cover NBA trade rumors and playoff predictions.",
        type: 'summary',
        relatedPosts: [] // Would include actual related posts
      };
    }
    
    if (queryLower.includes('lebron') || queryLower.includes('james')) {
      return {
        message: "Found 3 posts mentioning LeBron James. His recent stats show he's averaging 25.2 points, 7.8 rebounds, and 8.1 assists per game this season. Here are the relevant posts:",
        type: 'search',
        relatedPosts: [] // Would include actual LeBron posts
      };
    }
    
    if (queryLower.includes('tech') || queryLower.includes('ai')) {
      return {
        message: "Your technology posts cover AI breakthroughs, software development trends, and innovation in personal knowledge management. Recent highlights include discussions on machine learning applications and tech industry updates.",
        type: 'summary',
        relatedPosts: []
      };
    }
    
    return {
      message: `I found several posts related to "${query}". Here's what I discovered based on your saved content.`,
      type: 'search',
      relatedPosts: []
    };
  },

  // Get available topics for clustering
  async getAvailableTopics() {
    // In a real implementation, this would fetch from the database
    return [
      { id: '1', name: 'Technology', color: '#3B82F6' },
      { id: '2', name: 'Sports', color: '#EF4444' },
      { id: '3', name: 'Art & Design', color: '#8B5CF6' },
      { id: '4', name: 'Business', color: '#10B981' },
      { id: '5', name: 'Science', color: '#F59E0B' },
      { id: '6', name: 'Politics', color: '#6B7280' },
      { id: '7', name: 'Entertainment', color: '#EC4899' },
      { id: '8', name: 'Health', color: '#14B8A6' },
      { id: '9', name: 'Education', color: '#F97316' },
      { id: '10', name: 'Travel', color: '#06B6D4' }
    ];
  }
};
