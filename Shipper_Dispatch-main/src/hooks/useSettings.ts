import { useState, useEffect, useCallback } from "react";
import * as settingsService from "@/services/settingsService";

export interface ProfileSettings {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  shipmentUpdates: boolean;
  driverAlerts: boolean;
  paymentAlerts: boolean;
  weeklyReports: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: string;
}

export interface GeneralSettings {
  dateFormat: string;
  currency: string;
  timezone: string;
  darkMode: boolean;
}

export interface AppSettings {
  profile: ProfileSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  general: GeneralSettings;
}

const defaultSettings: AppSettings = {
  profile: {
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
  },
  notifications: {
    emailNotifications: true,
    shipmentUpdates: true,
    driverAlerts: true,
    paymentAlerts: false,
    weeklyReports: true,
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: "30",
  },
  general: {
    dateFormat: "MM/DD/YYYY",
    currency: "USD",
    timezone: "America/Chicago",
    darkMode: false,
  },
};

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [profile, notifications] = await Promise.all([
          settingsService.getProfile(),
          settingsService.getNotificationPreferences(),
        ]);
        setSettings((prev) => ({
          ...prev,
          profile: {
            companyName: profile.companyName ?? profile.displayName ?? prev.profile.companyName,
            contactName: profile.contactName ?? profile.displayName ?? prev.profile.contactName,
            email: profile.email ?? prev.profile.email,
            phone: profile.phone ?? prev.profile.phone,
            address: profile.address ?? prev.profile.address,
          },
          notifications: {
            emailNotifications: notifications.emailNotifications ?? prev.notifications.emailNotifications,
            shipmentUpdates: notifications.shipmentUpdates ?? prev.notifications.shipmentUpdates,
            driverAlerts: notifications.driverAlerts ?? prev.notifications.driverAlerts,
            paymentAlerts: notifications.paymentAlerts ?? prev.notifications.paymentAlerts,
            weeklyReports: notifications.weeklyReports ?? prev.notifications.weeklyReports,
          },
        }));
      } catch {
        // Keep defaults on error
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const updateSettings = useCallback(<K extends keyof AppSettings>(
    section: K,
    values: Partial<AppSettings[K]>
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...values },
    }));
  }, []);

  const saveSettings = useCallback(async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        settingsService.updateProfile({
          companyName: settings.profile.companyName,
          contactName: settings.profile.contactName,
          phone: settings.profile.phone,
          address: settings.profile.address,
        }),
        settingsService.updateNotificationPreferences(settings.notifications),
      ]);
    } finally {
      setIsSaving(false);
    }
  }, [settings.profile, settings.notifications]);

  return { settings, updateSettings, saveSettings, isSaving, isLoading };
}
