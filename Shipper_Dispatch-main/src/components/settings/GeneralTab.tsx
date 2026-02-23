import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, DollarSign, Globe, Moon } from "lucide-react";
import type { GeneralSettings } from "@/hooks/useSettings";

interface GeneralTabProps {
  general: GeneralSettings;
  onChange: (values: Partial<GeneralSettings>) => void;
}

export default function GeneralTab({ general, onChange }: GeneralTabProps) {
  return (
    <div className="space-y-1">
      {/* Date Format */}
      <div className="flex items-center justify-between rounded-xl p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Calendar size={18} /></div>
          <div>
            <p className="text-sm font-medium text-foreground">Date Format</p>
            <p className="text-xs text-muted-foreground">How dates appear across the app</p>
          </div>
        </div>
        <Select value={general.dateFormat} onValueChange={v => onChange({ dateFormat: v })}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Currency */}
      <div className="flex items-center justify-between rounded-xl p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><DollarSign size={18} /></div>
          <div>
            <p className="text-sm font-medium text-foreground">Currency</p>
            <p className="text-xs text-muted-foreground">Default currency for pricing</p>
          </div>
        </div>
        <Select value={general.currency} onValueChange={v => onChange({ currency: v })}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD ($)</SelectItem>
            <SelectItem value="EUR">EUR (€)</SelectItem>
            <SelectItem value="GBP">GBP (£)</SelectItem>
            <SelectItem value="CAD">CAD (C$)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timezone */}
      <div className="flex items-center justify-between rounded-xl p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Globe size={18} /></div>
          <div>
            <p className="text-sm font-medium text-foreground">Timezone</p>
            <p className="text-xs text-muted-foreground">Your local timezone</p>
          </div>
        </div>
        <Select value={general.timezone} onValueChange={v => onChange({ timezone: v })}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
            <SelectItem value="America/Chicago">Central (CT)</SelectItem>
            <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
            <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Dark Mode */}
      <div className="flex items-center justify-between rounded-xl p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Moon size={18} /></div>
          <div>
            <p className="text-sm font-medium text-foreground">Dark Mode</p>
            <p className="text-xs text-muted-foreground">Toggle dark appearance</p>
          </div>
        </div>
        <Switch
          checked={general.darkMode}
          onCheckedChange={checked => onChange({ darkMode: checked })}
        />
      </div>
    </div>
  );
}
