"use client";

import {
  ClearpathApplication,
  demoApplication,
  STORAGE_KEY,
} from "@/lib/domain";

export function loadApplication(id: string): ClearpathApplication | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const stored = raw ? JSON.parse(raw) as ClearpathApplication[] : [];
  const existing = stored.find((application) => application.id === id);
  if (existing) return existing;
  if (id === demoApplication.id) {
    saveApplication(demoApplication);
    return demoApplication;
  }
  return null;
}

export function saveApplication(application: ClearpathApplication) {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const stored = raw ? JSON.parse(raw) as ClearpathApplication[] : [];
  const applications = stored.filter((item) => item.id !== application.id);
  applications.push(application);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

export function deleteApplication(id: string) {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const stored = raw ? JSON.parse(raw) as ClearpathApplication[] : [];
  const remaining = stored.filter((application) => application.id !== id);
  if (remaining.length === 0) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  }
}

export function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `application-${Date.now()}`;
}
