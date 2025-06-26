
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Calendar, FileText, FolderOpen } from 'lucide-react';

interface PublicProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  stats?: {
    total_posts: number;
    total_collections: number;
    member_since: number;
  };
}

interface PublicProfileCardProps {
  profile: PublicProfile;
  onViewProfile: (userId: string) => void;
}

export const PublicProfileCard: React.FC<PublicProfileCardProps> = ({
  profile,
  onViewProfile
}) => {
  const getUserInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Card className="bg-slate-800/30 border-slate-700 hover:bg-slate-800/50 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12 border-2 border-slate-600">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-blue-500 text-white font-bold">
              {getUserInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">
              {profile.full_name || 'Anonymous User'}
            </h3>
            {profile.username && (
              <p className="text-sm text-slate-400">@{profile.username}</p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {profile.bio && (
          <p className="text-sm text-slate-300 line-clamp-2">
            {profile.bio}
          </p>
        )}
        
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Joined {formatDate(profile.created_at)}</span>
          </div>
        </div>
        
        {profile.stats && (
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
              <FileText className="h-3 w-3 mr-1" />
              {profile.stats.total_posts} posts
            </Badge>
            <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
              <FolderOpen className="h-3 w-3 mr-1" />
              {profile.stats.total_collections} collections
            </Badge>
          </div>
        )}
        
        <Button
          onClick={() => onViewProfile(profile.id)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          <User className="h-4 w-4 mr-2" />
          View Profile
        </Button>
      </CardContent>
    </Card>
  );
};
