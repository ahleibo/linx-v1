
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Homepage from "./pages/Homepage";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import Collections from "./pages/Collections";
import CollectionDetail from "./pages/CollectionDetail";
import NotFound from "./pages/NotFound";
import BottomNavigation from "./components/navigation/BottomNavigation";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { SessionValidator } from "./components/auth/SessionValidator";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  
  // Show bottom navigation on main app pages
  const showBottomNav = ['/home', '/explore', '/profile'].includes(location.pathname);

  return (
    <div className="min-h-screen">
      <SessionValidator />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/home" element={
          <ProtectedRoute>
            <Homepage />
          </ProtectedRoute>
        } />
        <Route path="/explore" element={
          <ProtectedRoute>
            <Explore />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/collections" element={
          <ProtectedRoute>
            <Collections />
          </ProtectedRoute>
        } />
        <Route path="/collections/:type/:collectionId" element={
          <ProtectedRoute>
            <CollectionDetail />
          </ProtectedRoute>
        } />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {showBottomNav && <BottomNavigation />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
