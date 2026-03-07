import { supabase } from "@/integrations/supabase/client";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
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
  if (!res.ok) throw new Error((body as ApiResponse<unknown>).error || `API error: ${res.status}`);
  return body as ApiResponse<T>;
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as ApiResponse<unknown>).error || `API error: ${res.status}`);
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
  if (!res.ok) throw new Error((data as ApiResponse<unknown>).error || `API error: ${res.status}`);
  return data as ApiResponse<T>;
}
