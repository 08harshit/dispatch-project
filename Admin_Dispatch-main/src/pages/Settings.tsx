import { useState, useEffect } from "react";
import { getColorClasses } from "@/utils/styleHelpers";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Bell,
  Shield,
  Building,
  Settings as SettingsIcon,
  Mail,
  Smartphone,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Key,
  Eye,
  EyeOff,
  ArrowUpRight,
  Palette,
  Globe,
  Clock,
  Save,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Monitor,
  LogOut,
  History,
  Fingerprint,
  RefreshCw
} from "lucide-react";

import { toast } from "sonner";
import { getProfile, updateProfile, getNotifications, updateNotifications, updatePassword } from "@/services/settingsService";

const settingsCategories = [
  { id: "profile", label: "Profile", icon: User, color: "primary" },
  { id: "company", label: "Company", icon: Building, color: "accent" },
  { id: "notifications", label: "Notifications", icon: Bell, color: "warning" },
  { id: "password", label: "Mot de passe", icon: KeyRound, color: "info" },
  { id: "security", label: "Security", icon: Shield, color: "success" },
];

const notificationSettings = [
  { id: "email", label: "Email Notifications", description: "Receive updates via email", icon: Mail, enabled: true },
  { id: "sms", label: "SMS Alerts", description: "Get critical alerts via text", icon: Smartphone, enabled: false },
  { id: "push", label: "Push Notifications", description: "Browser push notifications", icon: MessageSquare, enabled: true },
  { id: "urgent", label: "Urgent Alerts Only", description: "Only receive urgent notifications", icon: AlertTriangle, enabled: false },
];

// getColorClasses is now imported from @/utils/styleHelpers

export default function Settings() {
  const [activeSection, setActiveSection] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notifications, setNotifications] = useState(notificationSettings);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profile, setProfile] = useState<{ displayName: string; email: string }>({ displayName: "", email: "" });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [notificationsSaving, setNotificationsSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    Promise.all([getProfile(), getNotifications()])
      .then(([profileData, notifData]) => {
        setProfile({
          displayName: profileData.displayName ?? "",
          email: profileData.email ?? "",
        });
        setNotifications(prev =>
          prev.map(n => ({
            ...n,
            enabled: n.id === "email" ? (notifData.email ?? true) : n.id === "push" ? (notifData.push ?? true) : n.id === "urgent" ? (notifData.urgentOnly ?? false) : n.enabled,
          }))
        );
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setSettingsLoading(false));
  }, []);

  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score += 25;
    if (/[A-Z]/.test(password)) score += 25;
    if (/[0-9]/.test(password)) score += 25;
    if (/[^A-Za-z0-9]/.test(password)) score += 25;
    if (score <= 25) return { score, label: "Faible", color: "bg-destructive" };
    if (score <= 50) return { score, label: "Moyen", color: "bg-warning" };
    if (score <= 75) return { score, label: "Bon", color: "bg-primary" };
    return { score, label: "Excellent", color: "bg-success" };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordsMismatch = newPassword && confirmPassword && newPassword !== confirmPassword;

  const toggleNotification = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n)
    );
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      await updateProfile({ displayName: profile.displayName || undefined });
      toast.success("Profile saved successfully");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setNotificationsSaving(true);
    try {
      const email = notifications.find(n => n.id === "email")?.enabled ?? true;
      const push = notifications.find(n => n.id === "push")?.enabled ?? true;
      const urgentOnly = notifications.find(n => n.id === "urgent")?.enabled ?? false;
      await updateNotifications({ email, push, urgentOnly });
      toast.success("Notification preferences saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save notifications");
    } finally {
      setNotificationsSaving(false);
    }
  };

  const handleSave = (section: string) => {
    toast.info(`${section} settings — coming soon`);
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in new password and confirmation");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (passwordStrength.score < 50) {
      toast.error("Password is too weak");
      return;
    }
    setPasswordSaving(true);
    try {
      await updatePassword(newPassword);
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <MainLayout>
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-20 w-80 h-80 bg-success/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative space-y-8">
        {/* Page Header */}
        <div className="page-header">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="h-12 w-1.5 rounded-full bg-gradient-to-b from-primary to-primary/50 flex-shrink-0" />
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <SettingsIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                  <p className="text-muted-foreground">Manage your account and preferences</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 animate-fade-in stagger-1">
              <Badge variant="secondary" className="bg-success/10 text-success border-0 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                All systems operational
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {settingsCategories.map((category, index) => {
            const colors = getColorClasses(category.color);
            const isActive = activeSection === category.id;
            return (
              <button
                key={category.id}
                onClick={() => setActiveSection(category.id)}
                className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-500 hover:shadow-elevated hover:-translate-y-1 animate-fade-in ${isActive ? 'bg-card border-primary/30 shadow-glow' : 'bg-card/80 backdrop-blur-sm'
                  }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Hover gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                  </div>
                )}

                <div className="relative flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${colors.bg} transition-transform duration-300 group-hover:scale-110`}>
                    <category.icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{category.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {category.id === "profile" && "Personal info"}
                      {category.id === "company" && "Organization"}
                      {category.id === "notifications" && "Alerts & updates"}
                      {category.id === "password" && "Gestion du compte"}
                      {category.id === "security" && "Auth & sessions"}
                    </p>
                  </div>
                </div>

                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${colors.border} transform ${isActive ? 'scale-x-100' : 'scale-x-0'} group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
              </button>
            );
          })}
        </div>

        {/* Settings Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Settings */}
            {activeSection === "profile" && (
              <Card className="overflow-hidden border bg-card/80 backdrop-blur-sm animate-fade-in">
                {settingsLoading && (
                  <CardContent className="p-6 flex items-center justify-center text-muted-foreground">
                    Loading profile...
                  </CardContent>
                )}
                {!settingsLoading && (
                <>
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Profile Information</CardTitle>
                      <CardDescription>Update your personal details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-2xl font-bold text-primary-foreground">
                        JD
                      </div>
                      <div className="absolute inset-0 rounded-2xl bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <span className="text-xs text-background font-medium">Change</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">John Doe</p>
                      <p className="text-sm text-muted-foreground">Administrator</p>
                      <Badge variant="secondary" className="mt-1 bg-success/10 text-success border-0 text-xs">
                        Verified
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={profile.displayName}
                        onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))}
                        className="bg-muted/30 border-muted-foreground/20 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@company.com"
                        value={profile.email}
                        readOnly
                        className="bg-muted/30 border-muted-foreground/20 focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone Number</Label>
                      <Input id="phone" type="tel" placeholder="(555) 000-0000" className="bg-muted/30 border-muted-foreground/20 focus:border-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Timezone</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="timezone" placeholder="America/New_York" className="pl-10 bg-muted/30 border-muted-foreground/20 focus:border-primary" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={handleSaveProfile} className="gap-2" disabled={profileSaving}>
                      <Save className="h-4 w-4" />
                      {profileSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
                </>
                )}
              </Card>
            )}

            {/* Company Settings */}
            {activeSection === "company" && (
              <Card className="overflow-hidden border bg-card/80 backdrop-blur-sm animate-fade-in">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Building className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Company Information</CardTitle>
                      <CardDescription>Manage your organization details</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Company Name</Label>
                      <Input id="companyName" placeholder="Dispatch Inc." className="bg-muted/30 border-muted-foreground/20 focus:border-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyPhone" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</Label>
                      <Input id="companyPhone" type="tel" placeholder="(555) 000-0000" className="bg-muted/30 border-muted-foreground/20 focus:border-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="website" placeholder="https://dispatch.com" className="pl-10 bg-muted/30 border-muted-foreground/20 focus:border-primary" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Industry</Label>
                      <Input id="industry" placeholder="Logistics & Transportation" className="bg-muted/30 border-muted-foreground/20 focus:border-primary" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Address</Label>
                    <Input id="address" placeholder="123 Main St, City, State 12345" className="bg-muted/30 border-muted-foreground/20 focus:border-primary" />
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={() => handleSave("Company")} className="gap-2">
                      <Save className="h-4 w-4" />
                      Update Company
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications Settings */}
            {activeSection === "notifications" && (
              <Card className="overflow-hidden border bg-card/80 backdrop-blur-sm animate-fade-in">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10">
                      <Bell className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Notification Preferences</CardTitle>
                      <CardDescription>Choose how you want to be notified</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {notifications.map((notification, index) => (
                      <div
                        key={notification.id}
                        className="group relative flex items-center justify-between p-4 hover:bg-primary/5 transition-all duration-300 animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl transition-all duration-300 ${notification.enabled ? 'bg-primary/10' : 'bg-muted/50'
                            }`}>
                            <notification.icon className={`h-5 w-5 transition-colors duration-300 ${notification.enabled ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{notification.label}</p>
                            <p className="text-sm text-muted-foreground">{notification.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={notification.enabled}
                          onCheckedChange={() => toggleNotification(notification.id)}
                        />

                        {/* Hover glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg" />
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-muted/30 border-t flex justify-end">
                    <Button onClick={handleSaveNotifications} className="gap-2" disabled={notificationsSaving}>
                      <Save className="h-4 w-4" />
                      {notificationsSaving ? "Saving..." : "Save Preferences"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Password Management */}
            {activeSection === "password" && (
              <Card className="overflow-hidden border bg-card/80 backdrop-blur-sm animate-fade-in">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <KeyRound className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Gestion du Mot de Passe</CardTitle>
                      <CardDescription>Modifiez et sécurisez votre mot de passe</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Password Strength Overview */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { icon: ShieldCheck, label: "Dernière modification", value: "Il y a 45 jours", status: "warning" },
                      { icon: Fingerprint, label: "Force actuelle", value: "Bon", status: "success" },
                      { icon: History, label: "Historique", value: "3 changements", status: "primary" },
                    ].map((stat, index) => (
                      <div
                        key={stat.label}
                        className="group relative overflow-hidden rounded-xl border bg-muted/20 p-4 hover:bg-muted/30 transition-all duration-300 animate-fade-in"
                        style={{ animationDelay: `${index * 80}ms` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-${stat.status}/10`}>
                            <stat.icon className={`h-4 w-4 text-${stat.status}`} />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                            <p className="font-semibold text-foreground text-sm">{stat.value}</p>
                          </div>
                        </div>
                        <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${stat.status} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                      </div>
                    ))}
                  </div>

                  {/* Change Password Form */}
                  <div className="space-y-4 p-5 rounded-2xl border bg-gradient-to-br from-muted/30 to-transparent">
                    <div className="flex items-center gap-2 mb-4">
                      <Lock className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-foreground">Changer le mot de passe</h4>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pwCurrent" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mot de passe actuel</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="pwCurrent"
                          type={showPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-10 pr-10 bg-background/50 border-muted-foreground/20 focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pwNew" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nouveau mot de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="pwNew"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="pl-10 pr-10 bg-background/50 border-muted-foreground/20 focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Strength Meter */}
                      {newPassword && (
                        <div className="space-y-2 animate-fade-in">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Force du mot de passe</span>
                            <span className={`text-xs font-semibold ${passwordStrength.score <= 25 ? 'text-destructive' :
                                passwordStrength.score <= 50 ? 'text-warning' :
                                  passwordStrength.score <= 75 ? 'text-primary' : 'text-success'
                              }`}>{passwordStrength.label}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out ${passwordStrength.color}`}
                              style={{ width: `${passwordStrength.score}%` }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {[
                              { label: "8+ caractères", met: newPassword.length >= 8 },
                              { label: "Majuscule", met: /[A-Z]/.test(newPassword) },
                              { label: "Chiffre", met: /[0-9]/.test(newPassword) },
                              { label: "Caractère spécial", met: /[^A-Za-z0-9]/.test(newPassword) },
                            ].map((req) => (
                              <div key={req.label} className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${req.met ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                                <span className={`text-xs transition-colors duration-300 ${req.met ? 'text-foreground' : 'text-muted-foreground'}`}>{req.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pwConfirm" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Confirmer le mot de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="pwConfirm"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`pl-10 pr-10 bg-background/50 border-muted-foreground/20 focus:border-primary ${passwordsMatch ? 'border-success/50' : passwordsMismatch ? 'border-destructive/50' : ''
                            }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordsMatch && (
                        <p className="text-xs text-success flex items-center gap-1 animate-fade-in">
                          <CheckCircle2 className="h-3 w-3" /> Les mots de passe correspondent
                        </p>
                      )}
                      {passwordsMismatch && (
                        <p className="text-xs text-destructive flex items-center gap-1 animate-fade-in">
                          <ShieldAlert className="h-3 w-3" /> Les mots de passe ne correspondent pas
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Active Sessions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-semibold text-foreground text-sm">Sessions actives</h4>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive gap-1">
                        <LogOut className="h-3 w-3" />
                        Tout déconnecter
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {[
                        { device: "Chrome — Windows", location: "Paris, France", current: true, time: "Maintenant" },
                        { device: "Safari — iPhone", location: "Lyon, France", current: false, time: "Il y a 2h" },
                        { device: "Firefox — MacOS", location: "Marseille, France", current: false, time: "Il y a 1 jour" },
                      ].map((session, index) => (
                        <div
                          key={index}
                          className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-300 hover:shadow-sm animate-fade-in ${session.current ? 'bg-success/5 border-success/20' : 'bg-muted/10'
                            }`}
                          style={{ animationDelay: `${index * 60}ms` }}
                        >
                          <div className="flex items-center gap-3">
                            <Monitor className={`h-4 w-4 ${session.current ? 'text-success' : 'text-muted-foreground'}`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground">{session.device}</p>
                                {session.current && (
                                  <Badge variant="secondary" className="bg-success/10 text-success border-0 text-[10px] px-1.5 py-0">
                                    Actuel
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{session.location} · {session.time}</p>
                            </div>
                          </div>
                          {!session.current && (
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground hover:text-destructive">
                              <LogOut className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Générer un mot de passe
                    </Button>
                    <Button onClick={handlePasswordChange} className="gap-2" disabled={passwordSaving}>
                      <Save className="h-4 w-4" />
                      {passwordSaving ? "Saving..." : "Update"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Settings */}
            {activeSection === "security" && (
              <Card className="overflow-hidden border bg-card/80 backdrop-blur-sm animate-fade-in">
                <CardHeader className="border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <Shield className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Security Settings</CardTitle>
                      <CardDescription>Manage your password and authentication</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Password Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-semibold text-foreground">Change Password</h4>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Password</Label>
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="currentPassword"
                            type={showPassword ? "text" : "password"}
                            className="pl-10 pr-10 bg-muted/30 border-muted-foreground/20 focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="newPassword" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">New Password</Label>
                          <Input
                            id="newPassword"
                            type={showPassword ? "text" : "password"}
                            className="bg-muted/30 border-muted-foreground/20 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Confirm Password</Label>
                          <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            className="bg-muted/30 border-muted-foreground/20 focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="p-4 rounded-xl border bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-warning/10">
                          <Smartphone className="h-5 w-5 text-warning" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">Two-Factor Authentication</p>
                          <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="gap-2">
                        Enable
                        <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button onClick={() => handleSave("Security")} variant="outline" className="gap-2">
                      <Lock className="h-4 w-4" />
                      Change Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="overflow-hidden border bg-card/80 backdrop-blur-sm animate-fade-in stagger-2">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {[
                  { label: "Export Data", icon: ArrowUpRight },
                  { label: "View Activity Log", icon: Clock },
                  { label: "Customize Theme", icon: Palette },
                ].map((action, index) => (
                  <button
                    key={action.label}
                    className="group w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 transition-all duration-300"
                  >
                    <span className="text-sm font-medium text-foreground">{action.label}</span>
                    <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card className="overflow-hidden border bg-card/80 backdrop-blur-sm animate-fade-in stagger-3">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-lg">Account Status</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Plan</span>
                  <Badge className="bg-primary/10 text-primary border-0">Pro</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className="bg-success/10 text-success border-0 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Renewal</span>
                  <span className="text-sm font-medium text-foreground">Mar 15, 2026</span>
                </div>
                <div className="pt-2 border-t">
                  <Button variant="outline" className="w-full gap-2" size="sm">
                    Manage Subscription
                    <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
