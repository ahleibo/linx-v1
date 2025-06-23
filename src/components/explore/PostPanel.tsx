
import React from 'react';
import { X, Heart, MessageCircle, Repeat2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PostPanelProps {
  post: {
    id: string;
    author_name: string;
    author_username: string;
    author_avatar?: string;
    content: string;
    media_urls?: string[];
    created_at: string;
    likes_count?: number;
    retweets_count?: number;
    replies_count?: number;
    x_url?: string;
    post_topics?: Array<{
      topics: {
        id: string;
        name: string;
        color: string;
      };
    }>;
  };
  onClose: () => void;
}

export const PostPanel: React.FC<PostPanelProps> = ({ post, onClose }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-slate-900 border-slate-700 animate-slide-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div 
              className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
              style={{
                backgroundImage: post.author_avatar ? `url(${post.author_avatar})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {!post.author_avatar && (
                <span className="text-white font-bold text-lg">
                  {post.author_name.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white">{post.author_name}</h3>
              <p className="text-sm text-slate-400">@{post.author_username}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-white leading-relaxed">{post.content}</p>

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {post.media_urls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Media ${index + 1}`}
                  className="rounded-lg object-cover w-full h-32"
                />
              ))}
            </div>
          )}

          {/* Topics */}
          {post.post_topics && post.post_topics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.post_topics.map((topicRelation, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-slate-600 text-slate-300"
                  style={{
                    borderColor: topicRelation.topics.color,
                    color: topicRelation.topics.color
                  }}
                >
                  {topicRelation.topics.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-slate-400 pt-4 border-t border-slate-700">
            <span>{formatDate(post.created_at)}</span>
            {post.x_url && (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-slate-400 hover:text-white"
              >
                <a href={post.x_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View on X
                </a>
              </Button>
            )}
          </div>

          {/* Engagement Stats */}
          <div className="flex items-center space-x-6 text-slate-400">
            <div className="flex items-center space-x-1">
              <Heart className="h-4 w-4" />
              <span className="text-sm">{post.likes_count || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Repeat2 className="h-4 w-4" />
              <span className="text-sm">{post.retweets_count || 0}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{post.replies_count || 0}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
