"use client";

import {
  ClearpathApplication,
  demoApplication,
  STORAGE_KEY,
} from "@/lib/domain";

export function loadDemoApplication(): ClearpathApplication | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const stored = raw ? JSON.parse(raw) as ClearpathApplication[] : [];
  const existing = stored.find((application) => application.id === demoApplication.id);
  if (existing) return existing;
  saveDemoApplication(demoApplication);
  return demoApplication;
}

export function saveDemoApplication(application: ClearpathApplication) {
  if (application.id !== demoApplication.id || !application.isDemo) {
    throw new Error("Only the fictional demo can use browser storage.");
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const stored = raw ? JSON.parse(raw) as ClearpathApplication[] : [];
  const applications = stored.filter((item) => item.id !== application.id);
  applications.push(application);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

export function deleteDemoApplication() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `application-${Date.now()}`;
}
