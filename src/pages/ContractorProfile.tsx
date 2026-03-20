import { Routes, Route, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ContractorSidebar } from "@/components/contractor/ContractorSidebar";
import { ActiveBids } from "@/components/contractor/ActiveBids";
import { ProfileSettings } from "@/components/contractor/ProfileSettings";
import { Verification } from "@/components/contractor/Verification";
import { ReviewMediator } from "@/components/ReviewMediator";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Loader2 } from "lucide-react";
import { JobFeed } from "@/components/contractor/JobFeed";

const PAGE_META: Record<string, { title: string; description: string }> = {
  "": { title: "Job Feed", description: "Browse available jobs matching your expertise." },
  bids: { title: "Active Bids", description: "Track and manage your submitted bids." },
  reviews: { title: "My Reviews", description: "See what customers are saying about your work." },
  settings: { title: "Profile Settings", description: "Update your business details." },
  verification: { title: "Verification", description: "Manage your license and insurance credentials." },
};

function PageHeader({ segment }: { segment: string }) {
  const meta = PAGE_META[segment] ?? PAGE_META[""];
  return (
    <header className="h-16 flex items-center gap-4 border-b border-border px-6 bg-card shrink-0">
      <SidebarTrigger className="shrink-0 text-muted-foreground hover:text-foreground" />
      <div className="h-5 w-px bg-border" />
      <div>
        <h1 className="text-base font-heading font-bold text-foreground leading-tight">{meta.title}</h1>
        <p className="text-xs text-muted-foreground">{meta.description}</p>
      </div>
    </header>
  );
}

function useSegment() {
  const loc = useLocation();
  const parts = loc.pathname.replace(/\/$/, "").split("/");
  return parts[parts.length - 1] === "profile" ? "" : parts[parts.length - 1];
}


function ContractorReviews() {
  const { user } = useAuth();
  const [contractorId, setContractorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("contractors" as any)
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setContractorId((data as any).id);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading reviews…
      </div>
    );
  }

  if (!contractorId) {
    return <p className="text-center text-muted-foreground py-12 text-sm">No contractor profile found.</p>;
  }

  return <ReviewMediator contractorId={contractorId} mode="list" />;
}

const ContractorProfile = () => {
  const segment = useSegment();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar variant="solid" />
      <SidebarProvider>
        <div className="flex-1 flex w-full bg-secondary/30">
          <ContractorSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <PageHeader segment={segment} />
            <Routes>
              <Route
                index
                element={
                  <main className="flex-1 p-6 md:p-8 max-w-5xl w-full">
                    <JobFeed />
                  </main>
                }
              />
              <Route
                path="bids"
                element={
                  <main className="flex-1 p-6 md:p-8 max-w-5xl w-full">
                    <ActiveBids />
                  </main>
                }
              />
              <Route
                path="reviews"
                element={
                  <main className="flex-1 p-6 md:p-8 max-w-3xl w-full">
                    <ContractorReviews />
                  </main>
                }
              />
              <Route
                path="settings"
                element={
                  <main className="flex-1 p-6 md:p-8 max-w-2xl w-full">
                    <ProfileSettings />
                  </main>
                }
              />
              <Route
                path="verification"
                element={
                  <main className="flex-1 p-6 md:p-8 max-w-2xl w-full">
                    <Verification />
                  </main>
                }
              />
            </Routes>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default ContractorProfile;
