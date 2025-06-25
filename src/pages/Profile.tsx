import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from '@/components/ui/button';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { XPostImport } from '@/components/import/XPostImport';
import { XPostImportService } from '@/services/xPostImportService';
import { ImportHistory } from '@/components/import/ImportHistory';
import { SimpleTwitterImport } from '@/components/import/SimpleTwitterImport';

export const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [importHistory, setImportHistory] = useState([]);

  useEffect(() => {
    const fetchImportHistory = async () => {
      const history = await XPostImportService.getImportHistory();
      setImportHistory(history);
    };

    fetchImportHistory();
  }, []);

  const handleNavigateToExplore = () => {
    navigate('/explore');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-900 border-b border-slate-700 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Profile</h1>
          <div className="flex items-center gap-2">
            <ProfileSettings />
            <Avatar>
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>{user?.user_metadata?.full_name?.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-slate-800/30 border-slate-700 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-white mb-2">User Information</h2>
              <div className="space-y-2">
                <p className="text-slate-400">
                  <span className="font-semibold text-slate-300">Full Name:</span> {user?.user_metadata?.full_name}
                </p>
                <p className="text-slate-400">
                  <span className="font-semibold text-slate-300">Email:</span> {user?.email}
                </p>
                <p className="text-slate-400">
                  <span className="font-semibold text-slate-300">User ID:</span> {user?.id}
                </p>
              </div>
            </div>

            <XPostImport />
          </div>

          <div>
            <ImportHistory importHistory={importHistory} />
          </div>
        </div>
      
      {/* Replace TwitterBookmarkImport with SimpleTwitterImport */}
      <div className="mt-8">
        <SimpleTwitterImport />
      </div>
      
      </main>
    </div>
  );
};
