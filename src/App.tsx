import { useState, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index.tsx";

// Lazy-loaded routes to reduce initial bundle size
const Auth = lazy(() => import("./pages/Auth.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const Setup = lazy(() => import("./pages/Setup.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const PostProject = lazy(() => import("./pages/PostProject.tsx"));
const TradePhotoAnalyzer = lazy(() => import("./pages/TradePhotoAnalyzer.tsx"));
const VideoAnalyzer = lazy(() => import("./pages/VideoAnalyzer.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const ContractorSignUp = lazy(() => import("./pages/ContractorSignUp.tsx"));
const ContractorOnboarding = lazy(() => import("./pages/ContractorOnboarding.tsx"));
const ContractorProfile = lazy(() => import("./pages/ContractorProfile.tsx"));
const AIBiddingTools = lazy(() => import("./pages/AIBiddingTools.tsx"));
const SameDayPayments = lazy(() => import("./pages/SameDayPayments.tsx"));
const HowEscrowWorks = lazy(() => import("./pages/HowEscrowWorks.tsx"));
const BrowseContractors = lazy(() => import("./pages/BrowseContractors.tsx"));
const Install = lazy(() => import("./pages/Install.tsx"));
const ConnectReturn = lazy(() => import("./pages/ConnectReturn.tsx"));
const ConnectRefresh = lazy(() => import("./pages/ConnectRefresh.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const App = () => {
  const [splashDone, setSplashDone] = useState(false);

  return (
  <>
    {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={null}>
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
              <Route path="/contractor/connect/return" element={<ConnectReturn />} />
              <Route path="/contractor/connect/refresh" element={<ConnectRefresh />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </>
  );
};

export default App;
