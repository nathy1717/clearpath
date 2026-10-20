"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, TriangleAlert } from "lucide-react";

interface ApplicationSummary {
  id: string;
  name: string;
  type: "scholarship" | "internship";
  organization: string;
  deadline: string;
  updated_at: string;
}

export default function ApplicationList() {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadApplications() {
      try {
        const response = await fetch("/api/applications");
        if (!response.ok) throw new Error(`Could not load workspaces (${response.status}).`);
        const result = await response.json() as { applications: ApplicationSummary[] };
        if (active) setApplications(result.applications);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load workspaces.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadApplications();
    return () => { active = false; };
  }, []);

  return (
    <section className="my-workspaces" aria-labelledby="my-workspaces-title">
      <div className="workspace-list-heading">
        <div><div className="eyebrow">YOUR ACCOUNT</div><h2 id="my-workspaces-title">Your workspaces</h2></div>
        <Link href="/applications/new" className="text-link">New workspace <ArrowRight size={15} /></Link>
      </div>
      {loading && <p className="workspace-list-message">Loading your saved workspaces…</p>}
      {error && <p className="workspace-list-message workspace-list-error" role="alert"><TriangleAlert size={15} />{error}</p>}
      {!loading && !error && applications.length === 0 && (
        <div className="workspace-list-empty">
          <BriefcaseBusiness size={20} />
          <span>You have no saved workspaces yet. Create one to start organizing an application.</span>
          <Link href="/applications/new" className="button button-secondary">Create workspace <ArrowRight size={14} /></Link>
        </div>
      )}
      {applications.length > 0 && (
        <div className="workspace-list">
          {applications.map((application) => (
            <Link
              className="workspace-list-item"
              href={`/applications/${encodeURIComponent(application.id)}/assessment`}
              key={application.id}
            >
              <span className="opportunity-mark">{application.type === "scholarship" ? "S" : "I"}</span>
              <span className="workspace-list-title"><b>{application.name}</b><small>{application.organization || (application.type === "scholarship" ? "Scholarship" : "Internship")}</small></span>
              <span className="workspace-list-date">{application.deadline ? `Due ${application.deadline}` : "No deadline set"}</span>
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
