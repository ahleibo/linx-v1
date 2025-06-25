
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface ImportRecord {
  id: string;
  source_url: string;
  status: 'success' | 'failed';
  created_at: string;
  error_message?: string;
}

interface ImportHistoryProps {
  importHistory: ImportRecord[];
}

export const ImportHistory: React.FC<ImportHistoryProps> = ({ importHistory }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="bg-slate-800/30 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Clock className="h-5 w-5 text-slate-400" />
          Import History
        </CardTitle>
        <CardDescription className="text-slate-400">
          Recent import activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        {importHistory.length === 0 ? (
          <p className="text-slate-500 text-center py-4">No imports yet</p>
        ) : (
          <div className="space-y-3">
            {importHistory.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600"
              >
                <div className="flex items-center gap-3">
                  {record.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                  <div>
                    <p className="text-white text-sm font-medium">
                      {record.source_url.length > 50 
                        ? `${record.source_url.substring(0, 50)}...` 
                        : record.source_url}
                    </p>
                    {record.error_message && (
                      <p className="text-red-400 text-xs mt-1">{record.error_message}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={record.status === 'success' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {record.status}
                  </Badge>
                  <span className="text-slate-400 text-xs">
                    {formatDate(record.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
