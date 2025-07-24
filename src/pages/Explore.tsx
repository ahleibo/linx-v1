
import React, { useState, useEffect } from 'react';
import { Search, Mic, RotateCcw, Settings, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VoiceSearch } from '@/components/explore/VoiceSearch';
import { TopicDot } from '@/components/explore/TopicDot';
import { PostPanel } from '@/components/explore/PostPanel';
import { TweetCard } from '@/components/posts/TweetCard';
import { PublicProfileCard } from '@/components/social/PublicProfileCard';
import { PublicProfileModal } from '@/components/social/PublicProfileModal';
import { useTopics } from '@/hooks/useTopics';
import { usePosts } from '@/hooks/usePosts';
import { usePublicProfiles } from '@/hooks/usePublicProfiles';

interface Topic {
  id: string;
  name: string;
  color: string;
  description?: string;
}

const Explore = () => {
  const { topics, isLoading: topicsLoading, refetch: refetchTopics } = useTopics();
  const { 
    allSearchResults,
    isSearchingAll,
    searchQuery, 
    setSearchQuery 
  } = usePosts();
  const { data: publicProfiles = [], isLoading: profilesLoading } = usePublicProfiles();
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [showPostPanel, setShowPostPanel] = useState(false);
  const [showOwnPosts, setShowOwnPosts] = useState(true);
  const [centralTopics, setCentralTopics] = useState<Topic[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Generate 4 random topics for the iPod interface
  useEffect(() => {
    if (topics && topics.length > 0) {
      const shuffled = [...topics].sort(() => 0.5 - Math.random());
      setCentralTopics(shuffled.slice(0, 4));
    }
  }, [topics]);

  const handleRefresh = () => {
    refetchTopics();
    if (topics && topics.length > 0) {
      const shuffled = [...topics].sort(() => 0.5 - Math.random());
      setCentralTopics(shuffled.slice(0, 4));
    }
  };

  const handleTopicClick = (topic: Topic) => {
    setSelectedTopic(topic);
    setShowPostPanel(true);
  };

  const handleVoiceResult = (transcript: string) => {
    setSearchQuery(transcript);
    setShowVoiceSearch(false);
  };

  const handleClosePanel = () => {
    setShowPostPanel(false);
    setSelectedTopic(null);
  };

  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId);
    setShowProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowProfileModal(false);
    setSelectedUserId(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 z-20">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Explore</h1>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
          <Input
            placeholder="Search posts, users, or ask anything..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-12 bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500 h-12"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVoiceSearch(true)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <Mic className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Search Results</h3>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                "{searchQuery}" - {allSearchResults.length} results
              </Badge>
            </div>

            {isSearchingAll ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="bg-slate-800/30 border-slate-700 animate-pulse">
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
                  </Card>
                ))}
              </div>
            ) : allSearchResults.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {allSearchResults.map((post) => (
                  <TweetCard 
                    key={post.id} 
                    post={post} 
                    onDelete={() => window.location.reload()} 
                  />
                ))}
              </div>
            ) : (
              <Card className="bg-slate-800/30 border-slate-700">
                <CardContent className="p-6 text-center">
                  <div className="text-slate-400">
                    <Search className="h-8 w-8 mx-auto mb-2" />
                    <p>No posts found for "{searchQuery}"</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Try different keywords or explore below
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Main Content Tabs (only show when not searching) */}
        {!searchQuery && (
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/50">
              <TabsTrigger value="posts" className="data-[state=active]:bg-blue-500">
                Posts
              </TabsTrigger>
              <TabsTrigger value="people" className="data-[state=active]:bg-blue-500">
                <Users className="h-4 w-4 mr-2" />
                People
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-6">
              {/* Toggle */}
              <div className="flex items-center justify-center">
                <div className="bg-slate-800/50 rounded-full p-1 flex">
                  <Button
                    variant={showOwnPosts ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShowOwnPosts(true)}
                    className={`rounded-full px-6 ${
                      showOwnPosts 
                        ? 'bg-blue-500 text-white hover:bg-blue-600' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    My Posts
                  </Button>
                  <Button
                    variant={!showOwnPosts ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setShowOwnPosts(false)}
                    className={`rounded-full px-6 ${
                      !showOwnPosts 
                        ? 'bg-blue-500 text-white hover:bg-blue-600' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    All Posts
                  </Button>
                </div>
              </div>

              {/* iPod-style Interface */}
              <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8">
                {/* Topic Dots arranged around center */}
                <div className="relative w-80 h-80">
                  {/* Central Refresh Button */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Button
                      onClick={handleRefresh}
                      disabled={topicsLoading}
                      className="w-20 h-20 rounded-full bg-slate-700 hover:bg-slate-600 border-2 border-slate-600 transition-all duration-300 hover:scale-105"
                    >
                      <RotateCcw className={`h-8 w-8 text-white ${topicsLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>

                  {/* Topic Dots positioned around the center */}
                  {centralTopics.map((topic, index) => {
                    const positions = [
                      { top: '10%', left: '50%', transform: 'translateX(-50%)' }, // Top
                      { top: '50%', right: '10%', transform: 'translateY(-50%)' }, // Right
                      { bottom: '10%', left: '50%', transform: 'translateX(-50%)' }, // Bottom
                      { top: '50%', left: '10%', transform: 'translateY(-50%)' } // Left
                    ];

                    return (
                      <div
                        key={topic.id}
                        className="absolute"
                        style={positions[index]}
                      >
                        <TopicDot
                          topic={topic}
                          onClick={() => handleTopicClick(topic)}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Instructions */}
                <div className="text-center space-y-2">
                  <p className="text-slate-400 text-sm">
                    Tap the center to refresh topics
                  </p>
                  <p className="text-slate-500 text-xs">
                    Select a topic to explore posts
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="people" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Discover People</h3>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                    {publicProfiles.length} users
                  </Badge>
                </div>

                {profilesLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <Card key={i} className="bg-slate-800/30 border-slate-700 animate-pulse">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-slate-700 rounded-full" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-slate-700 rounded w-3/4" />
                              <div className="h-3 bg-slate-700 rounded w-1/2" />
                            </div>
                          </div>
                          <div className="h-16 bg-slate-700 rounded mb-3" />
                          <div className="h-8 bg-slate-700 rounded" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : publicProfiles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {publicProfiles.map((profile) => (
                      <PublicProfileCard
                        key={profile.id}
                        profile={profile}
                        onViewProfile={handleViewProfile}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="bg-slate-800/30 border-slate-700">
                    <CardContent className="p-6 text-center">
                      <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-400">No public profiles found</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Be the first to make your profile public!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Post Panel */}
      {showPostPanel && selectedTopic && (
        <PostPanel
          topic={selectedTopic}
          showOwnPosts={showOwnPosts}
          onClose={handleClosePanel}
        />
      )}

      {/* Profile Modal */}
      <PublicProfileModal
        userId={selectedUserId}
        isOpen={showProfileModal}
        onClose={handleCloseProfileModal}
      />

      {/* Voice Search Modal */}
      {showVoiceSearch && (
        <VoiceSearch
          onResult={handleVoiceResult}
          onClose={() => setShowVoiceSearch(false)}
        />
      )}
    </div>
  );
};

export default Explore;
