
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, FileText, FolderOpen, User } from 'lucide-react';
import { usePublicProfile } from '@/hooks/usePublicProfiles';

interface PublicProfileModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PublicProfileModal: React.FC<PublicProfileModalProps> = ({
  userId,
  isOpen,
  onClose
}) => {
  const { data: profile, isLoading } = usePublicProfile(userId || '');

  const getUserInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!userId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Profile
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-slate-700 rounded-full" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-700 rounded w-32" />
                <div className="h-3 bg-slate-700 rounded w-24" />
              </div>
            </div>
            <div className="h-16 bg-slate-700 rounded" />
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16 border-4 border-slate-600">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-blue-500 text-white text-lg font-bold">
                  {getUserInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">
                  {profile.full_name || 'Anonymous User'}
                </h2>
                {profile.username && (
                  <p className="text-slate-400">@{profile.username}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>Joined {formatDate(profile.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-2">About</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Stats */}
            {profile.stats && (
              <Card className="bg-slate-800/30 border-slate-700">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Activity</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <FileText className="h-4 w-4 text-blue-400 mr-1" />
                        <span className="text-lg font-bold text-blue-400">
                          {profile.stats.total_posts}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">Posts</div>
                    </div>
                    <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center justify-center mb-1">
                        <FolderOpen className="h-4 w-4 text-green-400 mr-1" />
                        <span className="text-lg font-bold text-green-400">
                          {profile.stats.total_collections}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">Collections</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400">Profile not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
