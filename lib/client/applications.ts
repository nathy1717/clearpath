import { ClearpathApplication } from "@/lib/domain";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${response.status}).`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function createApplication(application: ClearpathApplication) {
  return request<{ application: ClearpathApplication }>("/api/applications", {
    method: "POST",
    body: JSON.stringify(application),
  });
}

export function getApplication(id: string) {
  return request<{ application: ClearpathApplication }>(
    `/api/applications/${encodeURIComponent(id)}`,
  );
}

export function updateApplication(application: ClearpathApplication) {
  return request<{ application: ClearpathApplication }>(
    `/api/applications/${encodeURIComponent(application.id)}`,
    { method: "PATCH", body: JSON.stringify(application) },
  );
}

export function removeApplication(id: string) {
  return request<void>(`/api/applications/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
