import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProfileForm from "./pages/ProfileForm";
import Scholarships from "./pages/Scholarships";
import Marketplace from "./pages/Marketplace";
import Testimonials from "./pages/Testimonials";
import Contact from "./pages/Contact";
import Chat from "./pages/Chat";
import Dashboard from "./pages/Dashboard";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import ChatButton from "./components/ChatButton";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile-form" element={<ProfileForm />} />
          <Route path="/scholarships" element={<Scholarships />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatButton />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;