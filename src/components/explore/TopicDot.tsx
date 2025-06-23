
import React from 'react';
import { Button } from '@/components/ui/button';

interface TopicDotProps {
  topic: {
    id: string;
    name: string;
    color: string;
    description?: string;
  };
  position: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
    transform?: string;
  };
  onClick: () => void;
  isRefreshing: boolean;
  delay: number;
}

export const TopicDot: React.FC<TopicDotProps> = ({
  topic,
  position,
  onClick,
  isRefreshing,
  delay
}) => {
  return (
    <div
      className="absolute"
      style={position}
    >
      <Button
        onClick={onClick}
        disabled={isRefreshing}
        className={`
          w-16 h-16 rounded-full transition-all duration-500 hover:scale-110 
          shadow-lg border-2 border-white/10 backdrop-blur-sm
          ${isRefreshing ? 'animate-pulse' : ''}
        `}
        style={{
          backgroundColor: topic.color,
          animationDelay: `${delay}ms`
        }}
      >
        <div className="text-center">
          <div className="text-xs font-bold text-white truncate w-12">
            {topic.name.split(' ')[0]}
          </div>
        </div>
      </Button>
      
      {/* Topic Label */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 text-xs text-slate-300 text-center whitespace-nowrap">
        {topic.name}
      </div>
    </div>
  );
};
