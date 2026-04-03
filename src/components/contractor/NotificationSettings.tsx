import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, Smartphone } from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";

interface NotificationSettingsProps {
  role?: "contractor" | "homeowner";
}

export function NotificationSettings({ role = "contractor" }: NotificationSettingsProps) {
  const { enabled, loading, permissionState, subscribe, unsubscribe } = usePushNotifications();

  if (permissionState === "unsupported") return null;

  const blocked = permissionState === "denied";
  const iosPrompt = permissionState === "ios-not-installed";

  const description =
    role === "homeowner"
      ? "Get notified when bids arrive on your jobs."
      : "Get alerted when new jobs match your trade.";

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-heading">Notifications</CardTitle>
            <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {iosPrompt ? (
          <div className="flex items-start gap-3 bg-secondary/60 border border-border rounded-xl p-4 text-sm text-muted-foreground">
            <Smartphone className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
            <p>
              To receive push notifications on iPhone, add KisX to your home screen first: tap the
              Share button in Safari, then choose <strong>Add to Home Screen</strong>.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {enabled ? (
                  <Bell className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <BellOff className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <Label htmlFor="push-toggle" className="text-sm font-medium cursor-pointer">
                  {role === "homeowner" ? "Bid alerts" : "Job alerts"}
                </Label>
              </div>
              <Switch
                id="push-toggle"
                checked={enabled}
                disabled={loading || blocked}
                onCheckedChange={(checked) => {
                  if (checked) subscribe();
                  else unsubscribe();
                }}
              />
            </div>

            {blocked && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Notifications are blocked by your browser. To receive alerts, enable notifications
                in your browser or device settings.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
