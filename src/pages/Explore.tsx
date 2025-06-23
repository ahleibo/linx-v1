
import React, { useState, useEffect } from 'react';
import { Search, Mic, RefreshCw, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTopics } from '@/hooks/useTopics';
import { usePosts } from '@/hooks/usePosts';
import { TopicDot } from '@/components/explore/TopicDot';
import { PostPanel } from '@/components/explore/PostPanel';
import { VoiceSearch } from '@/components/explore/VoiceSearch';

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showOwnPosts, setShowOwnPosts] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);

  const { topics, isLoading: topicsLoading } = useTopics();
  const { searchResults, isSearching, searchQuery: currentSearch, setSearchQuery: updateSearch, chatMutation } = usePosts();

  // Get 4 random topics for the iPod interface
  const getRandomTopics = () => {
    if (!topics.length) return [];
    const shuffled = [...topics].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  };

  const refreshTopics = async () => {
    setIsRefreshing(true);
    // Simulate refresh animation
    await new Promise(resolve => setTimeout(resolve, 800));
    setSelectedTopics(getRandomTopics());
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (topics.length > 0 && selectedTopics.length === 0) {
      setSelectedTopics(getRandomTopics());
    }
  }, [topics]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    updateSearch(query);
  };

  const handleVoiceSearch = (transcript: string) => {
    handleSearch(transcript);
    setShowVoiceSearch(false);
  };

  const handleTopicClick = async (topic: any) => {
    // Simulate getting posts for this topic
    try {
      const response = await chatMutation.mutateAsync(`Show me posts about ${topic.name}`);
      // For now, we'll just search for the topic name
      handleSearch(topic.name);
    } catch (error) {
      console.error('Error fetching topic posts:', error);
      handleSearch(topic.name);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header with Search */}
      <div className="p-6 pb-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search posts, topics, or ask anything..."
            className="pl-10 pr-12 py-3 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500 rounded-xl"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVoiceSearch(true)}
            className="absolute right-2 top-2 text-slate-400 hover:text-white"
          >
            <Mic className="h-4 w-4" />
          </Button>
        </div>

        {/* Own/Others Toggle */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-slate-400" />
            <Label htmlFor="post-toggle" className="text-sm font-medium">
              {showOwnPosts ? 'Your Posts' : 'All Posts'}
            </Label>
            <Switch
              id="post-toggle"
              checked={!showOwnPosts}
              onCheckedChange={(checked) => setShowOwnPosts(!checked)}
            />
            <Users className="h-5 w-5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* iPod Interface */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
        <div className="relative w-80 h-80 flex items-center justify-center">
          {/* Central Refresh Dot */}
          <Button
            onClick={refreshTopics}
            disabled={isRefreshing}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 border-4 border-white/20 shadow-2xl transition-all duration-300 hover:scale-110 disabled:opacity-50"
          >
            <RefreshCw className={`h-8 w-8 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          {/* Four Topic Dots */}
          {selectedTopics.map((topic, index) => {
            const positions = [
              { top: '10%', left: '50%', transform: 'translateX(-50%)' }, // Top
              { top: '50%', right: '10%', transform: 'translateY(-50%)' }, // Right
              { bottom: '10%', left: '50%', transform: 'translateX(-50%)' }, // Bottom
              { top: '50%', left: '10%', transform: 'translateY(-50%)' }, // Left
            ];

            return (
              <TopicDot
                key={`${topic.id}-${index}`}
                topic={topic}
                position={positions[index]}
                onClick={() => handleTopicClick(topic)}
                isRefreshing={isRefreshing}
                delay={index * 100}
              />
            );
          })}
        </div>

        {/* Loading State */}
        {(topicsLoading || isSearching) && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-2 text-slate-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-200"></div>
              <span className="ml-2">Loading...</span>
            </div>
          </div>
        )}
      </div>

      {/* Search Results Preview */}
      {searchResults.length > 0 && (
        <div className="px-6 pb-4">
          <h3 className="text-lg font-semibold mb-3">Search Results</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {searchResults.slice(0, 3).map((post) => (
              <Card
                key={post.id}
                className="p-3 bg-slate-800/50 border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => setSelectedPost(post)}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{post.author_name}</p>
                    <p className="text-xs text-slate-400 truncate">{post.content}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Voice Search Modal */}
      {showVoiceSearch && (
        <VoiceSearch
          onResult={handleVoiceSearch}
          onClose={() => setShowVoiceSearch(false)}
        />
      )}

      {/* Post Panel */}
      {selectedPost && (
        <PostPanel
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
};

export default Explore;
