
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Mic, MicOff, User, Heart, MessageCircle, Repeat2, Share } from 'lucide-react';
import { cn } from "@/lib/utils";

// Mock data for posts
const mockPosts = [
  {
    id: '1',
    author: {
      name: 'Tech Innovator',
      username: '@techinnovator',
      avatar: '/placeholder.svg'
    },
    content: 'Just discovered an amazing breakthrough in AI research that could revolutionize how we approach machine learning. The implications for personal knowledge management are huge! 🧠✨',
    media: null,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    likes: 42,
    retweets: 12,
    replies: 8
  },
  {
    id: '2',
    author: {
      name: 'Design Master',
      username: '@designmaster',
      avatar: '/placeholder.svg'
    },
    content: 'Minimalist design isn\'t about removing features—it\'s about removing distractions. Every element should serve a purpose.',
    media: null,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    likes: 156,
    retweets: 34,
    replies: 23
  },
  {
    id: '3',
    author: {
      name: 'Sports Analytics',
      username: '@sportsdata',
      avatar: '/placeholder.svg'
    },
    content: 'LeBron James just hit another milestone! His consistency over 21 seasons is unprecedented. The data shows he\'s still performing at an elite level. 🏀📊',
    media: null,
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    likes: 89,
    retweets: 45,
    replies: 31
  },
  {
    id: '4',
    author: {
      name: 'Art Curator',
      username: '@artcurator',
      avatar: '/placeholder.svg'
    },
    content: 'Visited the new contemporary art exhibition today. The intersection of digital and traditional mediums creates such powerful narratives. Art continues to evolve.',
    media: null,
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    likes: 67,
    retweets: 19,
    replies: 15
  },
  {
    id: '5',
    author: {
      name: 'Climate Researcher',
      username: '@climatedata',
      avatar: '/placeholder.svg'
    },
    content: 'New research shows promising results for carbon capture technology. Small steps, but every innovation counts in our fight against climate change. 🌱',
    media: null,
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    likes: 203,
    retweets: 78,
    replies: 42
  }
];

interface Post {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  media: string | null;
  timestamp: Date;
  likes: number;
  retweets: number;
  replies: number;
}

const formatTimeAgo = (timestamp: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
};

const PostCard = ({ post }: { post: Post }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
      <div className="flex space-x-3">
        {/* Avatar */}
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-white" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">{post.author.name}</h3>
            <span className="text-gray-500 dark:text-gray-400 text-sm">{post.author.username}</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">·</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">{formatTimeAgo(post.timestamp)}</span>
          </div>
          
          {/* Post content */}
          <p className="text-gray-900 dark:text-white text-sm leading-relaxed mb-3">{post.content}</p>
          
          {/* Actions */}
          <div className="flex items-center justify-between max-w-md">
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2">
              <MessageCircle className="w-4 h-4 mr-1" />
              <span className="text-xs">{post.replies}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 p-2">
              <Repeat2 className="w-4 h-4 mr-1" />
              <span className="text-xs">{post.retweets}</span>
            </Button>
            
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2">
              <Heart className="w-4 h-4 mr-1" />
              <span className="text-xs">{post.likes}</span>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>(mockPosts);
  const [isListening, setIsListening] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Mock search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredPosts(mockPosts);
    } else {
      const filtered = mockPosts.filter(post => 
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPosts(filtered);
    }
  }, [searchQuery]);

  // Mock voice recognition
  const handleVoiceToggle = () => {
    setIsVoiceMode(!isVoiceMode);
    if (!isVoiceMode) {
      setIsListening(true);
      // Simulate voice recognition
      setTimeout(() => {
        setIsListening(false);
        setSearchQuery('sports'); // Mock voice input
      }, 2000);
    } else {
      setIsListening(false);
      setSearchQuery('');
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    // Mock LLM responses for specific queries
    if (query.toLowerCase().includes('summarize sports')) {
      // This would integrate with LLM in the future
      console.log('LLM Query: Summarize sports posts');
    }
  };

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
              {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} found
              {searchQuery.toLowerCase().includes('summarize') && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">• AI summary available</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feed */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="animate-fade-in">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No posts found</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center">
                Try searching for different keywords or topics
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Loading indicator for future API calls */}
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
