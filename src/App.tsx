
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Homepage from "./pages/Homepage";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import BottomNavigation from "./components/navigation/BottomNavigation";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  
  // Show bottom navigation on main app pages
  const showBottomNav = ['/home', '/explore', '/profile'].includes(location.pathname);

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/home" element={<Homepage />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/profile" element={<Profile />} />
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
