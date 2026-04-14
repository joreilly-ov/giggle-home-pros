import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase appends #access_token=...&type=recovery to the URL
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      // Let Supabase client pick up the tokens from the hash automatically
      supabase.auth.onAuthStateChange((event) => {
        if (event === "PASSWORD_RECOVERY") {
          setReady(true);
        }
      });
    } else {
      // Check if we already have a session (user may have landed here after the hash was consumed)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setReady(true);
        } else {
          toast({ title: "Invalid or expired link", description: "Please request a new password reset.", variant: "destructive" });
          navigate("/auth", { replace: true });
        }
      });
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Must be at least 8 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated", description: "You're now signed in." });
      navigate("/dashboard", { replace: true });
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
        <p className="text-muted-foreground">Verifying reset link…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-3xl font-extrabold font-heading text-foreground tracking-tight">
            Kis<span className="text-accent">X</span>
          </a>
          <p className="text-muted-foreground mt-2">Set your new password</p>
        </div>

        <div className="bg-card rounded-xl shadow-lg border border-border p-8">
          <h2 className="text-xl font-heading font-bold text-foreground mb-6">New password</h2>

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">New password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="pl-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Set new password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
