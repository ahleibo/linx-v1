import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, ArrowUp, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Source {
  id: string;
  author: string;
  content: string;
  url: string;
  date: string;
}

interface SearchResult {
  type: 'ai' | 'search';
  content: string;
  sources?: Source[];
  posts?: any[];
  timestamp: Date;
}

interface UnifiedSearchProps {
  onSearch: (query: string) => void;
  searchResults: any[];
  isSearching: boolean;
}

export const UnifiedSearch = ({ onSearch, searchResults, isSearching }: UnifiedSearchProps) => {
  const [input, setInput] = useState('');
  const [isAiMode, setIsAiMode] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setShowResults(true);

    if (isAiMode) {
      // AI mode - ask questions about posts
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast({
            title: "Authentication Error",
            description: "Please log in to ask questions",
            variant: "destructive",
          });
          return;
        }

        const { data, error } = await supabase.functions.invoke('ai-chat-posts', {
          body: { question: input.trim() },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        });

        if (error) throw error;

        const aiResult: SearchResult = {
          type: 'ai',
          content: data.answer,
          sources: data.sources || [],
          timestamp: new Date()
        };

        setResults(prev => [aiResult, ...prev]);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to get AI response",
          variant: "destructive",
        });
      }
    } else {
      // Search mode - search through posts
      onSearch(input.trim());
      const searchResult: SearchResult = {
        type: 'search',
        content: `Found ${searchResults.length} posts matching "${input.trim()}"`,
        posts: searchResults,
        timestamp: new Date()
      };
      setResults(prev => [searchResult, ...prev]);
    }

    setIsLoading(false);
    setInput('');
  };

  const handleModeToggle = () => {
    setIsAiMode(!isAiMode);
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Search Input */}
      <Card className="bg-slate-900/50 border-slate-700 overflow-hidden">
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center p-4">
              <div className="flex items-center gap-3 flex-1">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isAiMode 
                      ? "Ask about your posts... (e.g., 'What are the main themes?')"
                      : "Search your posts... (e.g., 'technology', 'AI')"
                  }
                  className="flex-1 bg-transparent text-white placeholder-slate-400 border-none outline-none text-lg"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={handleModeToggle}
                  variant="ghost"
                  size="sm"
                  className={`h-8 px-3 transition-all ${
                    isAiMode 
                      ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30' 
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  AI
                </Button>
                
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  size="sm"
                  className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {showResults && results.length > 0 && (
        <div className="space-y-4">
          {results.map((result, index) => (
            <Card key={index} className="bg-slate-900/30 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    result.type === 'ai' ? 'bg-purple-600' : 'bg-blue-600'
                  }`}>
                    {result.type === 'ai' ? (
                      <Sparkles className="h-4 w-4 text-white" />
                    ) : (
                      <Search className="h-4 w-4 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <p className="text-slate-100 whitespace-pre-wrap leading-relaxed">
                      {result.content}
                    </p>
                    
                    {/* AI Sources */}
                    {result.sources && result.sources.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400 font-medium">Sources:</p>
                        <div className="grid gap-2">
                          {result.sources.map((source, sourceIndex) => (
                            <div
                              key={sourceIndex}
                              className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="secondary" className="text-xs bg-slate-700">
                                  {source.author}
                                </Badge>
                                <span className="text-xs text-slate-500">{source.date}</span>
                              </div>
                              <p className="text-sm text-slate-300 mb-2">{source.content}</p>
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                              >
                                View post <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-slate-500">
                      {result.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};