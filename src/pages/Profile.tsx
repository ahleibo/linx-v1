import React, { useState } from 'react';
import { Search, Mic, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VoiceSearch } from '@/components/explore/VoiceSearch';
import { ImportDialog } from '@/components/import/ImportDialog';
import { UrlImportDialog } from '@/components/import/UrlImportDialog';
import { TwitterBookmarkImport } from '@/components/import/TwitterBookmarkImport';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { useProfileStats } from '@/hooks/useProfileStats';
import { CollectionGrid } from '@/components/profile/CollectionGrid';
import { InsightsSection } from '@/components/profile/InsightsSection';
import { PostSearchResults } from '@/components/profile/PostSearchResults';

const Profile = () => {
  const { user } = useAuth();
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching
  } = usePosts();
  const { stats, isLoading: statsLoading } = useProfileStats();
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);

  const handleVoiceResult = (transcript: string) => {
    setSearchQuery(transcript);
    setShowVoiceSearch(false);
  };

  const handleImportSuccess = () => {
    window.location.reload();
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 z-10">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold">Profile</h1>
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Import Post
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700 text-white">
                <DropdownMenuItem className="focus:bg-slate-700" asChild>
                  <UrlImportDialog 
                    trigger={
                      <div className="w-full cursor-pointer">
                        Import from URL
                      </div>
                    }
                    onSuccess={handleImportSuccess} 
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ProfileSettings />
          </div>
        </div>
      </div>

      <div className="p-4 space-y-8">
        {/* User Info Section */}
        <div className="flex flex-col items-start space-y-4">
          <div className="flex flex-row my-0 px-0 mx-0 gap-4 ">
            <Avatar className="w-24 h-24 border-4 border-slate-700">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-blue-500 text-white text-xl font-bold">
                {user?.user_metadata?.full_name ? getUserInitials(user.user_metadata.full_name) : 'LX'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col justify-start items-start text-left space-y-1">
              <h2 className="text-2xl font-bold">
                {user?.user_metadata?.full_name || 'LiNX User'}
              </h2>
              <p className="text-slate-400">@{user?.email?.split('@')[0] || 'user'}</p>
              <p className="text-sm text-slate-300 mt-2 max-w-xs">
                Curating knowledge, one post at a time. Building connections through shared insights.
              </p>
            </div>
          </div>
        </div>

        {/* Twitter Bookmark Import Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Import from Twitter</h3>
          <TwitterBookmarkImport />
        </div>

        {/* Search Bar */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input 
              placeholder="Search your posts..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="pl-10 pr-12 bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:border-blue-500" 
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
            <PostSearchResults 
              query={searchQuery} 
              results={searchResults} 
              isLoading={isSearching} 
            />
          )}
        </div>

        {/* Collections Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">Collections</h3>
            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <CollectionGrid />
        </div>

        {/* Insights Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Insights</h3>
          <InsightsSection stats={stats} isLoading={statsLoading} />
        </div>

        {/* Activity Summary */}
        <Card className="bg-slate-800/30 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Activity Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {stats?.totalPosts || 0}
                </div>
                <div className="text-sm text-slate-400">Posts Saved</div>
              </div>
              <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                <div className="text-2xl font-bold text-green-400">
                  {stats?.totalCollections || 0}
                </div>
                <div className="text-sm text-slate-400">Collections</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">This Month</span>
                <span className="text-white">{stats?.monthlyPosts || 0} posts</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{
                    width: `${Math.min((stats?.monthlyPosts || 0) / 50 * 100, 100)}%`
                  }} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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

export default Profile;
