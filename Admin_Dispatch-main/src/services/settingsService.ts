import { apiGet, apiPut } from "./api";

export interface ProfileData {
    displayName: string | null;
    avatarUrl: string | null;
    email: string;
    notificationPreferences?: { email?: boolean; push?: boolean; urgentOnly?: boolean };
}

export interface NotificationPreferences {
    email?: boolean;
    push?: boolean;
    urgentOnly?: boolean;
}

export async function getProfile(): Promise<ProfileData> {
    const res = await apiGet<ProfileData>("/settings/profile");
    if (!res.success || !res.data) {
        return { displayName: null, avatarUrl: null, email: "", notificationPreferences: { email: true, push: true, urgentOnly: false } };
    }
    return res.data;
}

export async function updateProfile(payload: { displayName?: string; avatarUrl?: string }): Promise<void> {
    const res = await apiPut<unknown>("/settings/profile", payload);
    if (!res.success) throw new Error(res.error || "Failed to update profile");
}

export async function getNotifications(): Promise<NotificationPreferences> {
    const res = await apiGet<NotificationPreferences>("/settings/notifications");
    if (!res.success || !res.data) {
        return { email: true, push: true, urgentOnly: false };
    }
    return res.data;
}

export async function updateNotifications(payload: NotificationPreferences): Promise<void> {
    const res = await apiPut<unknown>("/settings/notifications", payload);
    if (!res.success) throw new Error(res.error || "Failed to update notifications");
}

export async function updatePassword(newPassword: string): Promise<void> {
    const res = await apiPut<unknown>("/settings/password", { newPassword });
    if (!res.success) throw new Error(res.error || "Failed to change password");
}
