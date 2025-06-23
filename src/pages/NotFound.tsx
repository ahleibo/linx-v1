
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <Card className="bg-slate-800/30 border-slate-700 max-w-md w-full">
        <CardContent className="p-8 text-center space-y-6">
          <div className="space-y-2">
            <div className="text-6xl font-bold text-blue-400 mb-4">404</div>
            <h1 className="text-2xl font-bold">Page Not Found</h1>
            <p className="text-slate-400">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/home')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
            
            <Button 
              onClick={() => navigate(-1)}
              variant="outline"
              className="w-full border-slate-600 text-white hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            
            <Button 
              onClick={() => navigate('/explore')}
              variant="ghost"
              className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Search className="h-4 w-4 mr-2" />
              Explore Topics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
