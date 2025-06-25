
// Semantic search service for better post matching
export class SemanticSearchService {
  private synonymMap: Record<string, string[]> = {
    // Technology terms
    'tech': ['technology', 'technical', 'digital', 'software', 'hardware', 'computing', 'programming', 'coding', 'development'],
    'ai': ['artificial intelligence', 'machine learning', 'ml', 'neural network', 'deep learning', 'automation', 'bot', 'algorithm'],
    'dev': ['development', 'developer', 'programming', 'coding', 'software', 'engineering'],
    'code': ['coding', 'programming', 'development', 'software', 'script', 'algorithm'],
    'app': ['application', 'software', 'program', 'mobile', 'web app', 'platform', 'tool'],
    
    // Business terms
    'biz': ['business', 'company', 'corporate', 'enterprise', 'startup', 'entrepreneur'],
    'startup': ['business', 'entrepreneur', 'venture', 'company', 'innovation', 'founder'],
    'money': ['finance', 'financial', 'investment', 'revenue', 'profit', 'economy', 'economic'],
    'finance': ['financial', 'money', 'investment', 'banking', 'economy', 'market'],
    
    // Sports terms
    'sports': ['sport', 'athletic', 'game', 'competition', 'player', 'team', 'match', 'tournament'],
    'ball': ['basketball', 'football', 'soccer', 'baseball', 'tennis', 'volleyball'],
    'game': ['match', 'competition', 'contest', 'tournament', 'sport', 'play'],
    
    // Art & Design terms
    'art': ['artistic', 'design', 'creative', 'visual', 'aesthetic', 'painting', 'drawing', 'illustration'],
    'design': ['designer', 'creative', 'visual', 'ui', 'ux', 'graphic', 'aesthetic', 'style'],
    'creative': ['creativity', 'art', 'design', 'innovative', 'original', 'artistic'],
    
    // Health terms
    'health': ['healthy', 'wellness', 'medical', 'fitness', 'exercise', 'nutrition', 'healthcare'],
    'fitness': ['exercise', 'workout', 'training', 'gym', 'health', 'physical', 'sport'],
    
    // Education terms
    'learn': ['learning', 'education', 'study', 'knowledge', 'teaching', 'training', 'skill'],
    'education': ['learning', 'school', 'university', 'teaching', 'academic', 'study'],
    
    // Entertainment terms
    'movie': ['film', 'cinema', 'entertainment', 'hollywood', 'actor', 'director'],
    'music': ['song', 'artist', 'musician', 'band', 'album', 'concert', 'audio'],
    'show': ['tv', 'television', 'series', 'episode', 'program', 'entertainment'],
    
    // Travel terms
    'travel': ['trip', 'vacation', 'journey', 'destination', 'tourism', 'explore', 'adventure'],
    'food': ['cuisine', 'restaurant', 'cooking', 'recipe', 'meal', 'dining', 'culinary'],
    
    // Science terms
    'science': ['scientific', 'research', 'study', 'experiment', 'discovery', 'innovation'],
    'climate': ['environment', 'weather', 'global warming', 'sustainability', 'green', 'eco'],
    
    // Social terms
    'social': ['community', 'people', 'society', 'culture', 'relationship', 'network'],
    'news': ['current events', 'breaking', 'update', 'announcement', 'report', 'journalism']
  };

  private commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 
    'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 
    'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
  ]);

  // Extract meaningful keywords from search query
  private extractKeywords(query: string): string[] {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.commonWords.has(word))
      .filter(Boolean);
  }

  // Expand keywords with synonyms
  private expandKeywords(keywords: string[]): string[] {
    const expanded = new Set(keywords);
    
    keywords.forEach(keyword => {
      const synonyms = this.synonymMap[keyword] || [];
      synonyms.forEach(synonym => expanded.add(synonym));
      
      // Also check if keyword is a synonym of something else
      Object.entries(this.synonymMap).forEach(([key, values]) => {
        if (values.includes(keyword)) {
          expanded.add(key);
          values.forEach(v => expanded.add(v));
        }
      });
    });

    return Array.from(expanded);
  }

  // Create semantic search patterns
  public createSearchPatterns(query: string): string[] {
    const keywords = this.extractKeywords(query);
    const expandedKeywords = this.expandKeywords(keywords);
    
    // Add partial matches and variations
    const patterns = new Set(expandedKeywords);
    
    // Add original query
    patterns.add(query.toLowerCase());
    
    return Array.from(patterns);
  }

  // Score relevance of text against search patterns
  public scoreRelevance(text: string, patterns: string[]): number {
    const lowerText = text.toLowerCase();
    let score = 0;
    
    patterns.forEach(pattern => {
      // Exact phrase match (highest score)
      if (lowerText.includes(pattern)) {
        score += pattern.length > 5 ? 10 : 5;
      }
      
      // Word boundary matches
      const words = pattern.split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) {
          const regex = new RegExp(`\\b${word}\\b`, 'i');
          if (regex.test(lowerText)) {
            score += 3;
          } else if (lowerText.includes(word)) {
            score += 1;
          }
        }
      });
    });
    
    return score;
  }

  // Enhanced search method
  public searchPosts(posts: any[], query: string): any[] {
    if (!query.trim()) return posts;
    
    const patterns = this.createSearchPatterns(query);
    console.log('Search patterns for "' + query + '":', patterns);
    
    // Score and filter posts
    const scoredPosts = posts
      .map(post => {
        let score = 0;
        
        // Score content
        score += this.scoreRelevance(post.content || '', patterns);
        
        // Score author name/username (lower weight)
        score += this.scoreRelevance(post.author_name || '', patterns) * 0.5;
        score += this.scoreRelevance(post.author_username || '', patterns) * 0.5;
        
        // Score topics if available
        if (post.post_topics) {
          post.post_topics.forEach((pt: any) => {
            if (pt.topics?.name) {
              score += this.scoreRelevance(pt.topics.name, patterns) * 2;
            }
          });
        }
        
        return { ...post, relevanceScore: score };
      })
      .filter(post => post.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    console.log(`Found ${scoredPosts.length} relevant posts for "${query}"`);
    return scoredPosts;
  }
}

export const semanticSearch = new SemanticSearchService();
