import { useEffect, useState } from "react";
import { Building2, User, ChevronRight, LogOut, Loader2, AlertTriangle } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { ClipboardList, PlusCircle, Search } from "lucide-react";

const menuItems = [
  { title: "My Projects", url: "/dashboard", icon: ClipboardList },
  { title: "Post a Project", url: "/post-project", icon: PlusCircle },
  { title: "Find Contractors", url: "/browse-contractors", icon: Search },
];

export function CustomerSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, signOut } = useAuth();
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(true);
        } else if (data) {
          setFullName(data.full_name);
        }
        setLoading(false);
      });
  }, [user]);

  const isActive = (path: string) => currentPath === path;

  const renderBrand = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          {!collapsed && <span className="text-xs">Failed to load</span>}
        </div>
      );
    }

    if (!collapsed) {
      return (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold font-heading text-foreground leading-tight truncate">
              {fullName ?? "Homeowner"}
            </p>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary mt-0.5">
              Customer
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center mx-auto">
        <User className="w-5 h-5 text-primary-foreground" />
      </div>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-card pt-4">
        {/* Brand */}
        <div className="px-4 pb-4 border-b border-border mb-2">
          {renderBrand()}
        </div>

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-4 mb-1">
              Menu
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      activeClassName="bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary font-semibold"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.title}</span>
                          {isActive(item.url) && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
                        </>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-card border-t border-border p-3 space-y-1">
        {!collapsed && user && (
          <div className="px-3 py-2 rounded-lg bg-secondary/50 mb-2">
            <p className="text-xs font-medium text-foreground truncate">{user.email}</p>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Sign out</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
