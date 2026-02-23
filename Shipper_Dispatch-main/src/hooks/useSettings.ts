import { useState, useEffect, useCallback } from "react";

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
    companyName: "Shipper Dispatch Co.",
    contactName: "John Smith",
    email: "john@shipperdispatch.com",
    phone: "(555) 123-4567",
    address: "123 Logistics Blvd, Dallas, TX 75201",
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

const STORAGE_KEY = "shipper-dispatch-settings";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });
  const [isSaving, setIsSaving] = useState(false);

  const updateSettings = useCallback(<K extends keyof AppSettings>(
    section: K,
    values: Partial<AppSettings[K]>
  ) => {
    setSettings(prev => ({
      ...prev,
      [section]: { ...prev[section], ...values },
    }));
  }, []);

  const saveSettings = useCallback(async () => {
    setIsSaving(true);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setIsSaving(false);
  }, [settings]);

  return { settings, updateSettings, saveSettings, isSaving };
}
