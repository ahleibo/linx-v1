
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Mic, MicOff, User, Heart, MessageCircle, Repeat2, Share } from 'lucide-react';
import { cn } from "@/lib/utils";
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';

interface Post {
  id: string;
  author_name: string;
  author_username: string;
  author_avatar: string | null;
  content: string;
  media_urls: string[] | null;
  created_at: string;
  likes_count: number | null;
  retweets_count: number | null;
  replies_count: number | null;
  post_topics?: Array<{
    topics: {
      id: string;
      name: string;
      color: string;
    };
  }>;
}

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const postTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - postTime.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
};

const PostCard = ({ post }: { post: Post }) => {
  const topics = post.post_topics?.map(pt => pt.topics) || [];

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
          {post.author_avatar ? (
            <img src={post.author_avatar} alt={post.author_name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <User className="w-6 h-6 text-white" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">{post.author_name}</h3>
            <span className="text-gray-500 dark:text-gray-400 text-sm">@{post.author_username}</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">·</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">{formatTimeAgo(post.created_at)}</span>
          </div>
          
          {/* Post content */}
          <p className="text-gray-900 dark:text-white text-sm leading-relaxed mb-3">{post.content}</p>
          
          {/* Topics */}
          {topics.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {topics.map((topic) => (
                <span
                  key={topic.id}
                  className="px-2 py-1 text-xs rounded-full text-white"
                  style={{ backgroundColor: topic.color }}
                >
                  {topic.name}
                </span>
              ))}
            </div>
          )}
          
          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {post.media_urls.slice(0, 4).map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt="Post media"
                  className="rounded-lg object-cover w-full h-32"
                />
              ))}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between max-w-md">
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2">
              <MessageCircle className="w-4 h-4 mr-1" />
              <span className="text-xs">{post.replies_count || 0}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 p-2">
              <Repeat2 className="w-4 h-4 mr-1" />
              <span className="text-xs">{post.retweets_count || 0}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2">
              <Heart className="w-4 h-4 mr-1" />
              <span className="text-xs">{post.likes_count || 0}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2">
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Homepage = () => {
  const { user } = useAuth();
  const {
    posts,
    isLoading,
    searchResults,
    isSearching,
    searchQuery,
    setSearchQuery,
    chatMutation
  } = usePosts();

  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const displayPosts = searchQuery ? searchResults : posts;
  const isLoadingPosts = searchQuery ? isSearching : isLoading;

  // Mock voice recognition
  const handleVoiceToggle = () => {
    setIsVoiceMode(!isVoiceMode);
    if (!isVoiceMode) {
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        setSearchQuery('sports');
      }, 2000);
    } else {
      setIsListening(false);
      setSearchQuery('');
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    // Process AI queries
    if (query.toLowerCase().includes('summarize') || 
        query.toLowerCase().includes('find') || 
        query.toLowerCase().includes('show me')) {
      
      try {
        const response = await chatMutation.mutateAsync(query);
        setAiResponse(response.message);
      } catch (error) {
        console.error('AI query failed:', error);
      }
    } else {
      setAiResponse('');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Please sign in</h2>
          <p className="text-gray-600 dark:text-gray-400">You need to be authenticated to view your posts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header with Search */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          {/* Logo */}
          <div className="flex items-center justify-center mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <h1 className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Lynx</h1>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder={isListening ? "Listening..." : "Search posts, topics, or ask a question..."}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className={cn(
                "pl-10 pr-12 h-12 bg-gray-100 dark:bg-gray-800 border-0 focus:bg-white dark:focus:bg-gray-700 transition-all duration-300",
                isListening && "ring-2 ring-blue-500 ring-opacity-50"
              )}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoiceToggle}
              className={cn(
                "absolute right-2 top-1/2 transform -translate-y-1/2 p-2",
                isVoiceMode && "text-blue-500",
                isListening && "animate-pulse"
              )}
            >
              {isVoiceMode || isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>
          </div>
          
          {/* Search Results Info */}
          {searchQuery && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {displayPosts.length} post{displayPosts.length !== 1 ? 's' : ''} found
              {chatMutation.isPending && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">• AI processing...</span>
              )}
            </div>
          )}
          
          {/* AI Response */}
          {aiResponse && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <p className="text-sm text-blue-900 dark:text-blue-100">{aiResponse}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feed */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="animate-fade-in">
          {isLoadingPosts ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : displayPosts.length > 0 ? (
            displayPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No posts found' : 'No posts yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                {searchQuery 
                  ? 'Try searching for different keywords or topics'
                  : 'Start by saving some posts from X to see them here'
                }
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Loading indicator for voice */}
      {isListening && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg animate-pulse">
          <div className="flex items-center space-x-2">
            <Mic className="w-4 h-4" />
            <span className="text-sm">Listening...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepage;
