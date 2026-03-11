import { apiGet, apiPut } from "./api";

export interface ProfileData {
  displayName?: string | null;
  avatarUrl?: string | null;
  email: string;
  companyName?: string;
  contactName?: string;
  phone?: string;
  address?: string;
}

export interface NotificationPreferences {
  emailNotifications?: boolean;
  shipmentUpdates?: boolean;
  driverAlerts?: boolean;
  paymentAlerts?: boolean;
  weeklyReports?: boolean;
}

export async function getProfile(): Promise<ProfileData> {
  const res = await apiGet<ProfileData>("/settings/profile");
  return res.data ?? { email: "" };
}

export async function updateProfile(data: Partial<ProfileData>): Promise<ProfileData> {
  const res = await apiPut<ProfileData>("/settings/profile", data);
  return res.data ?? { email: "" };
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const res = await apiGet<NotificationPreferences>("/settings/notifications");
  return res.data ?? { emailNotifications: true, shipmentUpdates: true, driverAlerts: true, paymentAlerts: false, weeklyReports: true };
}

export async function updateNotificationPreferences(data: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
  const res = await apiPut<NotificationPreferences>("/settings/notifications", data);
  return res.data ?? {};
}
