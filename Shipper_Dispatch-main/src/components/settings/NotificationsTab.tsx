import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Mail, Truck, Users, CreditCard, BarChart3 } from "lucide-react";
import type { NotificationSettings } from "@/hooks/useSettings";

interface NotificationsTabProps {
  notifications: NotificationSettings;
  onChange: (values: Partial<NotificationSettings>) => void;
}

const items: { key: keyof NotificationSettings; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: "emailNotifications", label: "Email Notifications", desc: "Receive email updates for important events", icon: <Mail size={18} /> },
  { key: "shipmentUpdates", label: "Shipment Updates", desc: "Get notified when shipment status changes", icon: <Truck size={18} /> },
  { key: "driverAlerts", label: "Driver Alerts", desc: "Alerts when drivers accept or decline offers", icon: <Users size={18} /> },
  { key: "paymentAlerts", label: "Payment Alerts", desc: "Notifications for payment status changes", icon: <CreditCard size={18} /> },
  { key: "weeklyReports", label: "Weekly Reports", desc: "Receive a weekly summary of activity", icon: <BarChart3 size={18} /> },
];

export default function NotificationsTab({ notifications, onChange }: NotificationsTabProps) {
  return (
    <div className="space-y-1">
      {items.map(({ key, label, desc, icon }) => (
        <div key={key} className="flex items-center justify-between rounded-xl p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
            <div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
          <Switch
            checked={notifications[key]}
            onCheckedChange={checked => onChange({ [key]: checked })}
          />
        </div>
      ))}
    </div>
  );
}
