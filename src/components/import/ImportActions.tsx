
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ImportActionsProps {
  isLoading: boolean;
  postsCount: number;
  onImport: () => void;
  onCancel?: () => void;
}

export const ImportActions = ({ isLoading, postsCount, onImport, onCancel }: ImportActionsProps) => {
  return (
    <div className="flex space-x-4">
      <Button
        onClick={onImport}
        disabled={isLoading || postsCount === 0}
        className="flex-1 bg-blue-500 hover:bg-blue-600"
      >
        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Import {postsCount > 0 && `${postsCount} Post${postsCount > 1 ? 's' : ''}`}
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
  );
};
