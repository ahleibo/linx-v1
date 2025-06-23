
import React, { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, Repeat2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { postService } from '@/services/postService';

interface Topic {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface Post {
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
}

interface PostPanelProps {
  topic: Topic;
  showOwnPosts: boolean;
  onClose: () => void;
}

export const PostPanel: React.FC<PostPanelProps> = ({ topic, showOwnPosts, onClose }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const topicPosts = await postService.getPostsByTopic(topic.id);
        setPosts(topicPosts || []);
      } catch (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [topic.id]);

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
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: topic.color }}
            >
              {topic.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-white">{topic.name}</h3>
              <p className="text-sm text-slate-400">{posts.length} posts</p>
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

        {/* Posts List */}
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="text-center text-slate-400">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center text-slate-400">No posts found for this topic</div>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="border-b border-slate-700 pb-4 last:border-b-0">
                {/* Post Author */}
                <div className="flex items-center space-x-3 mb-3">
                  <Avatar className="w-8 h-8">
                    {post.author_avatar && (
                      <AvatarImage src={post.author_avatar} alt={post.author_name} />
                    )}
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs">
                      {post.author_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-white text-sm">{post.author_name}</p>
                    <p className="text-xs text-slate-400">@{post.author_username}</p>
                  </div>
                </div>

                {/* Post Content */}
                <p className="text-white text-sm leading-relaxed mb-3">{post.content}</p>

                {/* Media */}
                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {post.media_urls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Media ${index + 1}`}
                        className="rounded-lg object-cover w-full h-24"
                      />
                    ))}
                  </div>
                )}

                {/* Post Footer */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>{formatDate(post.created_at)}</span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Heart className="h-3 w-3" />
                      <span>{post.likes_count || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Repeat2 className="h-3 w-3" />
                      <span>{post.retweets_count || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="h-3 w-3" />
                      <span>{post.replies_count || 0}</span>
                    </div>
                    {post.x_url && (
                      <a href={post.x_url} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
