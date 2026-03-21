import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Setup from "./pages/Setup.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Profile from "./pages/Profile.tsx";
import PostProject from "./pages/PostProject.tsx";
import TradePhotoAnalyzer from "./pages/TradePhotoAnalyzer.tsx";
import VideoAnalyzer from "./pages/VideoAnalyzer.tsx";
import About from "./pages/About.tsx";
import Contact from "./pages/Contact.tsx";
import Privacy from "./pages/Privacy.tsx";
import ContractorSignUp from "./pages/ContractorSignUp.tsx";
import ContractorOnboarding from "./pages/ContractorOnboarding.tsx";
import ContractorProfile from "./pages/ContractorProfile.tsx";
import AIBiddingTools from "./pages/AIBiddingTools.tsx";
import SameDayPayments from "./pages/SameDayPayments.tsx";
import HowEscrowWorks from "./pages/HowEscrowWorks.tsx";
import BrowseContractors from "./pages/BrowseContractors.tsx";
import Install from "./pages/Install.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/post-project" element={<PostProject />} />
            <Route path="/photo-analyzer" element={<TradePhotoAnalyzer />} />
            <Route path="/video-analyzer" element={<VideoAnalyzer />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/contractor-signup" element={<ContractorSignUp />} />
            <Route path="/contractor/signup" element={<ContractorOnboarding />} />
            <Route path="/contractor/profile/*" element={<ContractorProfile />} />
            <Route path="/ai-bidding-tools" element={<AIBiddingTools />} />
            <Route path="/same-day-payments" element={<SameDayPayments />} />
            <Route path="/how-escrow-works" element={<HowEscrowWorks />} />
            <Route path="/browse-contractors" element={<BrowseContractors />} />
            <Route path="/install" element={<Install />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
