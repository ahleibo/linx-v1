
import { useAuth } from '@/hooks/useAuth';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <User className="text-2xl text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Lynx</h1>
          <p className="text-gray-600 text-sm mb-6">Your Personal Knowledge Management</p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Signed in as:</p>
            <p className="font-medium text-gray-900">{user?.email}</p>
          </div>
          
          <Button
            onClick={signOut}
            className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
