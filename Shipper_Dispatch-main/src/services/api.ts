import { supabase } from "@/integrations/supabase/client";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

function assertOnline(): void {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("You are offline. Please check your connection and try again.");
  }
}

let authRedirectPending = false;

function handleResponseError(res: Response, data: { error?: string }): never {
  if (res.status === 401) {
    if (!authRedirectPending) {
      authRedirectPending = true;
      supabase.auth.signOut().finally(() => {
        window.location.href = "/landing";
      });
    }
  }
  throw new Error(data.error || `API error: ${res.status}`);
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  assertOnline();
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    handleResponseError(res, body as { error?: string });
  }
  return body as ApiResponse<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    handleResponseError(res, data as { error?: string });
  }
  return data as ApiResponse<T>;
}

export async function apiPut<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    handleResponseError(res, data as { error?: string });
  }
  return data as ApiResponse<T>;
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    handleResponseError(res, data as { error?: string });
  }
  return data as ApiResponse<T>;
}

export async function apiDelete<T>(path: string): Promise<ApiResponse<T>> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE", headers: authHeaders });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    handleResponseError(res, data as { error?: string });
  }
  return data as ApiResponse<T>;
}
