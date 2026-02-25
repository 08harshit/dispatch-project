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

function handleResponseError(res: Response, data: { error?: string }): never {
    if (res.status === 401) {
        window.location.href = "/auth";
    }
    throw new Error(data.error || `API error: ${res.status}`);
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}${path}`, { headers: { ...authHeaders } });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        handleResponseError(res, body);
    }
    return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        handleResponseError(res, data);
    }
    return res.json();
}

export async function apiPut<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}${path}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        handleResponseError(res, data);
    }
    return res.json();
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}${path}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        handleResponseError(res, data);
    }
    return res.json();
}

export async function apiDelete<T>(path: string): Promise<ApiResponse<T>> {
    const authHeaders = await getAuthHeaders();
    const res = await fetch(`${API_BASE}${path}`, { method: "DELETE", headers: authHeaders });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        handleResponseError(res, data);
    }
    return res.json();
}
