
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { postImportService, type XPostData } from '@/services/postImportService';

interface PostImportFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PostImportForm = ({ onSuccess, onCancel }: PostImportFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<Partial<XPostData>[]>([{
    url: '',
    content: '',
    authorName: '',
    authorUsername: '',
    createdAt: new Date().toISOString()
  }]);

  const addNewPost = () => {
    setPosts([...posts, {
      url: '',
      content: '',
      authorName: '',
      authorUsername: '',
      createdAt: new Date().toISOString()
    }]);
  };

  const removePost = (index: number) => {
    if (posts.length > 1) {
      setPosts(posts.filter((_, i) => i !== index));
    }
  };

  const updatePost = (index: number, field: keyof XPostData, value: string | number) => {
    const updated = [...posts];
    updated[index] = { ...updated[index], [field]: value };
    setPosts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validPosts = posts.filter(post => 
        post.content && post.authorName && post.authorUsername
      ) as XPostData[];

      if (validPosts.length === 0) {
        toast({
          title: "No valid posts",
          description: "Please fill in at least content, author name, and username for one post.",
          variant: "destructive"
        });
        return;
      }

      const results = await postImportService.importMultiplePosts(validPosts);
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      if (successful > 0) {
        toast({
          title: "Posts imported successfully",
          description: `${successful} post${successful > 1 ? 's' : ''} imported${failed > 0 ? `, ${failed} failed` : ''}.`
        });
        onSuccess?.();
      } else {
        toast({
          title: "Import failed",
          description: "No posts could be imported. Please check your data.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Import error",
        description: "Failed to import posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-slate-800/30 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Import X Posts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {posts.map((post, index) => (
            <div key={index} className="space-y-4 p-4 border border-slate-600 rounded-lg relative">
              {posts.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePost(index)}
                  className="absolute top-2 right-2 text-slate-400 hover:text-red-400"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              
              <div className="space-y-2">
                <Label className="text-slate-300">X Post URL (optional)</Label>
                <Input
                  placeholder="https://x.com/username/status/123456789"
                  value={post.url || ''}
                  onChange={(e) => updatePost(index, 'url', e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Author Name *</Label>
                  <Input
                    placeholder="John Doe"
                    value={post.authorName || ''}
                    onChange={(e) => updatePost(index, 'authorName', e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Username *</Label>
                  <Input
                    placeholder="johndoe"
                    value={post.authorUsername || ''}
                    onChange={(e) => updatePost(index, 'authorUsername', e.target.value)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Post Content *</Label>
                <Textarea
                  placeholder="Enter the post content here..."
                  value={post.content || ''}
                  onChange={(e) => updatePost(index, 'content', e.target.value)}
                  className="bg-slate-700/50 border-slate-600 text-white min-h-[100px]"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Likes</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={post.likesCount || ''}
                    onChange={(e) => updatePost(index, 'likesCount', parseInt(e.target.value) || 0)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Retweets</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={post.retweetsCount || ''}
                    onChange={(e) => updatePost(index, 'retweetsCount', parseInt(e.target.value) || 0)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Replies</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={post.repliesCount || ''}
                    onChange={(e) => updatePost(index, 'repliesCount', parseInt(e.target.value) || 0)}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={addNewPost}
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Post
          </Button>

          <div className="flex space-x-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-500 hover:bg-blue-600"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Import Posts
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
