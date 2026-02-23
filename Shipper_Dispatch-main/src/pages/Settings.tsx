import { User, Bell, Shield, Settings as SettingsIcon, Save } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useSettings } from "@/hooks/useSettings";
import ProfileTab from "@/components/settings/ProfileTab";
import NotificationsTab from "@/components/settings/NotificationsTab";
import SecurityTab from "@/components/settings/SecurityTab";
import GeneralTab from "@/components/settings/GeneralTab";

const Settings = () => {
  const { settings, updateSettings, saveSettings, isSaving } = useSettings();

  const handleSave = async () => {
    await saveSettings();
    toast.success("Settings saved successfully");
  };

  return (
    <MainLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save size={16} />
          {isSaving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <div className="dashboard-card">
        <Tabs defaultValue="profile">
          <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent px-4 pt-2 gap-1">
            <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-t-lg">
              <User size={16} /> Profile
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-t-lg">
              <Bell size={16} /> Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-t-lg">
              <Shield size={16} /> Security
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-t-lg">
              <SettingsIcon size={16} /> General
            </TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent value="profile">
              <ProfileTab profile={settings.profile} onChange={v => updateSettings("profile", v)} />
            </TabsContent>
            <TabsContent value="notifications">
              <NotificationsTab notifications={settings.notifications} onChange={v => updateSettings("notifications", v)} />
            </TabsContent>
            <TabsContent value="security">
              <SecurityTab security={settings.security} onChange={v => updateSettings("security", v)} />
            </TabsContent>
            <TabsContent value="general">
              <GeneralTab general={settings.general} onChange={v => updateSettings("general", v)} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Settings;
