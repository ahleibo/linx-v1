
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/home',
    },
    {
      icon: Search,
      label: 'Explore',
      path: '/explore',
    },
    {
      icon: User,
      label: 'Profile',
      path: '/profile',
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 z-50">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center space-y-1 py-3 px-4 rounded-lg transition-colors ${
                active 
                  ? 'text-blue-400 bg-blue-500/10' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation;
