import { Settings as SettingsIcon, User, Bell, Building2, Shield, CreditCard, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export const SetupPage = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Setup</h1>
        <p className="text-muted-foreground">Configure your dispatch system settings</p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card className="border-border rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profile Settings
            </CardTitle>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="John Doe" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@company.com" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+1 (555) 123-4567" className="rounded-xl" />
            </div>
            <Button className="w-full rounded-xl bg-primary hover:bg-primary/90">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Company Settings */}
        <Card className="border-border rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Company Settings
            </CardTitle>
            <CardDescription>Configure your company details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input id="company" placeholder="ABC Logistics" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mc">MC Number</Label>
              <Input id="mc" placeholder="MC-123456" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dot">DOT Number</Label>
              <Input id="dot" placeholder="DOT-789012" className="rounded-xl" />
            </div>
            <Button className="w-full rounded-xl bg-primary hover:bg-primary/90">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Manage notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">SMS Alerts</p>
                <p className="text-sm text-muted-foreground">Get text alerts for urgent updates</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Late Delivery Alerts</p>
                <p className="text-sm text-muted-foreground">Alert when delivery is delayed</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-border rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security
            </CardTitle>
            <CardDescription>Manage security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input id="confirm-password" type="password" className="rounded-xl" />
            </div>
            <Button className="w-full rounded-xl bg-primary hover:bg-primary/90">Update Password</Button>
          </CardContent>
        </Card>

        {/* Credit Card for Subscriptions */}
        <Card className="border-border rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Subscription Billing
            </CardTitle>
            <CardDescription>Add a card for monthly subscription payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="card-name">Cardholder Name</Label>
              <Input id="card-name" placeholder="John Doe" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <Input id="card-number" placeholder="•••• •••• •••• ••••" className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input id="expiry" placeholder="MM/YY" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input id="cvc" placeholder="•••" className="rounded-xl" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Secure payment</span>
              </div>
              <Switch />
            </div>
            <Button className="w-full rounded-xl bg-primary hover:bg-primary/90">Save Card</Button>
          </CardContent>
        </Card>

        {/* Driver Payout Settings */}
        <Card className="border-border rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Driver Payouts
            </CardTitle>
            <CardDescription>Configure automatic driver payment settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payout-account">Bank Account Number</Label>
              <Input id="payout-account" placeholder="•••••••• 1234" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routing">Routing Number</Label>
              <Input id="routing" placeholder="•••••••••" className="rounded-xl" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-pay on delivery</p>
                <p className="text-sm text-muted-foreground">Pay drivers when load is marked complete</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly batch payouts</p>
                <p className="text-sm text-muted-foreground">Process all payouts every Friday</p>
              </div>
              <Switch />
            </div>
            <Button className="w-full rounded-xl bg-primary hover:bg-primary/90">Save Payout Settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
