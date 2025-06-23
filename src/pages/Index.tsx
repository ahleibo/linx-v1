
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Search, Hash, User } from 'lucide-react';

const Index = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (provider: 'google' | 'github') => {
    try {
      await signIn(provider);
      navigate('/home');
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const features = [
    {
      icon: <Search className="h-6 w-6" />,
      title: "Smart Search",
      description: "Find posts with AI-powered search and voice commands"
    },
    {
      icon: <Hash className="h-6 w-6" />,
      title: "Topic Clustering",
      description: "Automatically organize posts by topics and themes"
    },
    {
      icon: <User className="h-6 w-6" />,
      title: "Personal Insights",
      description: "Track your knowledge journey with detailed analytics"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="border-b border-slate-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold">LiNX</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
            Your Personal Knowledge Universe
          </h2>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Save, organize, and explore your X bookmarks with AI-powered insights. 
            Transform scattered posts into structured knowledge.
          </p>
          
          <div className="space-y-4 max-w-sm mx-auto">
            <Button 
              onClick={() => handleSignIn('google')}
              className="w-full bg-white text-slate-900 hover:bg-slate-100 font-semibold py-3 text-lg transition-all duration-200 hover:scale-105"
            >
              Continue with Google
            </Button>
            <Button 
              onClick={() => handleSignIn('github')}
              variant="outline"
              className="w-full border-slate-600 text-white hover:bg-slate-800 font-semibold py-3 text-lg transition-all duration-200"
            >
              Continue with GitHub
            </Button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="bg-slate-800/30 border-slate-700 hover:bg-slate-800/50 transition-all duration-300 hover:scale-105">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-blue-400">
                  {feature.icon}
                </div>
                <CardTitle className="text-white text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-center leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-slate-400">
            <p>&copy; 2024 LiNX. Curating knowledge, one post at a time.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
