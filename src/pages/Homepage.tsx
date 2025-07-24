import React, { useState } from 'react';
import { Search, Mic, TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { VoiceSearch } from '@/components/explore/VoiceSearch';
import { ImportDialog } from '@/components/import/ImportDialog';
import { UrlImportDialog } from '@/components/import/UrlImportDialog';
import { TweetCard } from '@/components/posts/TweetCard';
import { AiChatInterface } from '@/components/ai/AiChatInterface';
import { usePosts } from '@/hooks/usePosts';
import { useTrendingTopics } from '@/hooks/useTrendingTopics';
import { useAuth } from '@/hooks/useAuth';
const Homepage = () => {
  const {
    user
  } = useAuth();
  const {
    posts,
    filteredPosts,
    networkSearchResults,
    isSearchingNetwork,
    searchQuery,
    setSearchQuery,
    isLoading
  } = usePosts();
  const { data: trendingTopics = [], isLoading: isLoadingTopics } = useTrendingTopics();
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  
  const handleVoiceResult = (transcript: string) => {
    setSearchQuery(transcript);
    setShowVoiceSearch(false);
  };
  
  const handleImportSuccess = () => {
    window.location.reload();
  };

  // Determine which posts to show based on search
  const postsToShow = searchQuery ? networkSearchResults.length > 0 ? networkSearchResults : filteredPosts : posts;
  return <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 z-10">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-2xl font-bold">Good morning</h1>
            <p className="text-slate-400 text-sm">
              {user?.user_metadata?.full_name || 'Explorer'}
            </p>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Import Post
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
              <DropdownMenuItem className="focus:bg-slate-700" asChild>
                <UrlImportDialog trigger={<div className="w-full cursor-pointer">
                      Import from URL
                    </div>} onSuccess={handleImportSuccess} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
          <Input placeholder="Search your knowledge base..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-12 bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 h-12" />
          <Button variant="ghost" size="sm" onClick={() => setShowVoiceSearch(true)} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white">
            <Mic className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Results Header */}
        {searchQuery && <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Search Results for "{searchQuery}"
            </h2>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
              {postsToShow.length} results
            </Badge>
          </div>}

        {/* Trending Topics (only show when not searching and there are topics) */}
        {!searchQuery && !isLoadingTopics && trendingTopics.length > 0 && <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold">Trending in Your Network</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {trendingTopics.map(topic => <Card key={topic.name} className="bg-slate-800/30 border-slate-700 hover:bg-slate-800/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: topic.color }}
                      />
                      <Badge variant="secondary" className="bg-slate-700/50 text-slate-300 text-xs">
                        {topic.count}
                      </Badge>
                    </div>
                    <h3 className="font-medium text-white text-sm">{topic.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">posts this week</p>
                  </CardContent>
                </Card>)}
            </div>
          </div>}

        {/* AI Chat Interface (show when there are posts) */}
        {!searchQuery && posts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Ask AI about your posts</h2>
            <AiChatInterface />
          </div>
        )}

        {/* Posts Feed */}
        <div className="space-y-4">
          {!searchQuery && <h2 className="text-lg font-semibold">Recent from Your Network</h2>}
          
          {isLoading || isSearchingNetwork ? <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Card key={i} className="bg-slate-800/30 border-slate-700 animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex space-x-3">
                      <div className="w-10 h-10 bg-slate-700 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-700 rounded w-1/3" />
                        <div className="h-3 bg-slate-700 rounded w-full" />
                        <div className="h-3 bg-slate-700 rounded w-2/3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>)}
            </div> : postsToShow.length > 0 ? <div className="space-y-3">
              {postsToShow.slice(0, 10).map(post => <TweetCard key={post.id} post={post} />)}
            </div> : searchQuery ? <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="p-8 text-center">
                <div className="text-slate-400 space-y-4">
                  <Search className="h-12 w-12 mx-auto mb-3" />
                  <div>
                    <p className="mb-2">No posts found for "{searchQuery}"</p>
                    <p className="text-sm text-slate-500">Try different keywords or import more posts</p>
                  </div>
                </div>
              </CardContent>
            </Card> : <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="p-8 text-center">
                <div className="text-slate-400 space-y-4">
                  <Search className="h-12 w-12 mx-auto mb-3" />
                  <div>
                    <p className="mb-2">No posts yet</p>
                    <p className="text-sm text-slate-500 mb-4">Import your first X post to get started</p>
                    <UrlImportDialog trigger={<Button variant="outline" className="border-slate-600 text-slate-300 bg-blue-700 hover:bg-blue-600">
                          Import Your First Post
                        </Button>} onSuccess={handleImportSuccess} />
                  </div>
                </div>
              </CardContent>
            </Card>}
        </div>
      </div>

      {/* Voice Search Modal */}
      {showVoiceSearch && <VoiceSearch onResult={handleVoiceResult} onClose={() => setShowVoiceSearch(false)} />}
    </div>;
};
export default Homepage;