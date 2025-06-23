
import React from 'react';
import { Button } from '@/components/ui/button';

interface TopicDotProps {
  topic: {
    id: string;
    name: string;
    color: string;
    description?: string;
  };
  onClick: () => void;
}

export const TopicDot: React.FC<TopicDotProps> = ({ topic, onClick }) => {
  return (
    <div className="flex flex-col items-center">
      <Button
        onClick={onClick}
        className="w-16 h-16 rounded-full transition-all duration-300 hover:scale-110 shadow-lg border-2 border-white/10 backdrop-blur-sm"
        style={{ backgroundColor: topic.color }}
      >
        <div className="text-center">
          <div className="text-xs font-bold text-white truncate w-12">
            {topic.name.split(' ')[0]}
          </div>
        </div>
      </Button>
      
      {/* Topic Label */}
      <div className="mt-2 text-xs text-slate-300 text-center whitespace-nowrap max-w-20 truncate">
        {topic.name}
      </div>
    </div>
  );
};
