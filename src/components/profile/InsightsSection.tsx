
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar, Target, Award } from 'lucide-react';

interface InsightsSectionProps {
  stats: {
    totalPosts: number;
    totalCollections: number;
    monthlyPosts: number;
    topTopics: Array<{ name: string; count: number; percentage: number }>;
    averagePostsPerWeek: number;
    totalSavedThisYear: number;
  } | undefined;
  isLoading: boolean;
}

export const InsightsSection: React.FC<InsightsSectionProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="bg-slate-800/30 border-slate-700 animate-pulse">
          <CardContent className="p-4">
            <div className="h-20 bg-slate-700 rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) return null;

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="h-5 w-5" />;
      case 'calendar':
        return <Calendar className="h-5 w-5" />;
      case 'target':
        return <Target className="h-5 w-5" />;
      default:
        return <Award className="h-5 w-5" />;
    }
  };

  const insights = [
    {
      id: 'top-topics',
      title: 'Top Interests',
      type: 'trend',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      content: (
        <div className="space-y-2">
          {stats.topTopics.slice(0, 3).map((topic) => (
            <div key={topic.name} className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{topic.name}</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(topic.percentage, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-8 text-right">
                  {topic.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'activity',
      title: 'Activity Pattern',
      type: 'calendar',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      content: (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-300">Weekly Average</span>
            <Badge variant="secondary" className="bg-green-500/20 text-green-400">
              {stats.averagePostsPerWeek} posts
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-300">This Month</span>
            <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
              {stats.monthlyPosts} posts
            </Badge>
          </div>
          <div className="text-xs text-slate-400">
            {stats.averagePostsPerWeek > 5 ? 'Very active' : 
             stats.averagePostsPerWeek > 2 ? 'Regular activity' : 'Getting started'}
          </div>
        </div>
      )
    },
    {
      id: 'year-progress',
      title: 'Year Progress',
      type: 'target',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      content: (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-300">Posts Saved</span>
            <span className="text-lg font-bold text-purple-400">
              {stats.totalSavedThisYear}
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min((stats.totalSavedThisYear / 365) * 100, 100)}%` 
              }}
            />
          </div>
          <div className="text-xs text-slate-400">
            {Math.round((stats.totalSavedThisYear / 365) * 100)}% of daily goal
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {insights.map((insight) => (
        <Card key={insight.id} className="bg-slate-800/30 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              <div className={`p-2 rounded-lg ${insight.bgColor}`}>
                <div className={insight.color}>
                  {getInsightIcon(insight.type)}
                </div>
              </div>
              <span className="text-white">{insight.title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {insight.content}
          </CardContent>
        </Card>
      ))}

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-slate-700">
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {stats.totalPosts > 100 ? 'Knowledge Expert' :
               stats.totalPosts > 50 ? 'Active Curator' :
               stats.totalPosts > 10 ? 'Rising Collector' : 'Getting Started'}
            </div>
            <p className="text-sm text-slate-400">
              You've saved {stats.totalPosts} posts across {stats.totalCollections} collections
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
