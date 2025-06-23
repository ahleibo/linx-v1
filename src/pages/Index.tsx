
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Search, User, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect authenticated users to home
  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent"></div>
        <div className="relative px-4 py-20 mx-auto max-w-4xl text-center">
          <div className="space-y-6">
            <div className="inline-flex items-center px-4 py-2 bg-slate-800/50 rounded-full border border-slate-700">
              <Sparkles className="h-4 w-4 mr-2 text-blue-400" />
              <span className="text-sm text-slate-300">AI-Powered Knowledge Management</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-300 bg-clip-text text-transparent">
                LiNX
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Your personal knowledge companion. Save, organize, and explore your X posts with intelligent AI clustering.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button 
                onClick={() => navigate('/auth')}
                size="lg"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105"
              >
                Get Started
              </Button>
              <Button 
                onClick={() => navigate('/auth')}
                variant="outline"
                size="lg"
                className="border-slate-600 text-white hover:bg-slate-800 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-4 py-20 mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Experience the future of personal knowledge management with our AI-driven platform.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-slate-800/30 border-slate-700 hover:bg-slate-800/50 transition-all duration-300">
            <CardHeader>
              <BookOpen className="h-8 w-8 text-blue-400 mb-4" />
              <CardTitle className="text-white">Smart Organization</CardTitle>
              <CardDescription className="text-slate-400">
                AI automatically clusters your posts by topics, making it easy to find related content.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/30 border-slate-700 hover:bg-slate-800/50 transition-all duration-300">
            <CardHeader>
              <Search className="h-8 w-8 text-green-400 mb-4" />
              <CardTitle className="text-white">Intelligent Search</CardTitle>
              <CardDescription className="text-slate-400">
                Natural language search and voice commands to find exactly what you're looking for.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/30 border-slate-700 hover:bg-slate-800/50 transition-all duration-300">
            <CardHeader>
              <User className="h-8 w-8 text-purple-400 mb-4" />
              <CardTitle className="text-white">Personal Insights</CardTitle>
              <CardDescription className="text-slate-400">
                Get detailed analytics about your interests and discover patterns in your saved content.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-4 py-20 mx-auto max-w-4xl text-center">
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl p-8 md:p-12 border border-slate-700">
          <h3 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to organize your knowledge?
          </h3>
          <p className="text-slate-400 text-lg mb-8">
            Join thousands of users who've transformed how they manage their digital knowledge.
          </p>
          <Button 
            onClick={() => navigate('/auth')}
            size="lg"
            className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105"
          >
            Start Your Journey
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
