import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, KeyRound, Clock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { SecuritySettings } from "@/hooks/useSettings";

interface SecurityTabProps {
  security: SecuritySettings;
  onChange: (values: Partial<SecuritySettings>) => void;
}

export default function SecurityTab({ security, onChange }: SecurityTabProps) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* 2FA */}
      <div className="flex items-center justify-between rounded-xl p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Shield size={18} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
            <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
          </div>
        </div>
        <Switch
          checked={security.twoFactorEnabled}
          onCheckedChange={checked => onChange({ twoFactorEnabled: checked })}
        />
      </div>

      {/* Session Timeout */}
      <div className="flex items-center justify-between rounded-xl p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Session Timeout</p>
            <p className="text-xs text-muted-foreground">Auto-logout after inactivity (minutes)</p>
          </div>
        </div>
        <Input
          type="number"
          min="5"
          max="120"
          className="w-20 text-center"
          value={security.sessionTimeout}
          onChange={e => onChange({ sessionTimeout: e.target.value })}
        />
      </div>

      {/* Change Password */}
      <div className="rounded-xl border border-border p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <KeyRound size={18} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Change Password</p>
            <p className="text-xs text-muted-foreground">Update your account password</p>
          </div>
        </div>
        {showPasswordForm ? (
          <div className="space-y-3 pl-12">
            <div className="space-y-1.5">
              <Label htmlFor="currentPw" className="text-xs">Current Password</Label>
              <Input id="currentPw" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPw" className="text-xs">New Password</Label>
              <Input id="newPw" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPw" className="text-xs">Confirm New Password</Label>
              <Input id="confirmPw" type="password" placeholder="••••••••" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => { toast.success("Password updated"); setShowPasswordForm(false); }}>
                Update Password
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowPasswordForm(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="ml-12" onClick={() => setShowPasswordForm(true)}>
            Change Password
          </Button>
        )}
      </div>
    </div>
  );
}
