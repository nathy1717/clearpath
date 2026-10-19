"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  Flag,
  Info,
  ListChecks,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  ApplicationTask,
  AuditFinding,
  AuditRun,
  AuditSeverity,
  ClearpathApplication,
  buildAudit,
  deriveEligibility,
  taskProgress,
} from "@/lib/domain";
import { deleteApplication, loadApplication, saveApplication } from "@/lib/storage";

type WorkspaceView = "assessment" | "tasks" | "audit";
type EvidenceFilter = "all" | "missing" | "review" | "matched";

const evidenceLabels = {
  matched: "Evidence noted",
  missing: "Missing",
  needs_verification: "Needs a check",
  conflict: "Conflict",
  not_applicable: "Not applicable",
};

const eligibilityLabels = {
  likely_meets_stated_criteria: "Likely meets stated criteria",
  potential_issue: "Potential issue to address",
  insufficient_information: "More information needed",
};

const taskLabels = {
  todo: "To do",
  in_progress: "In progress",
  completed: "Completed",
  blocked: "Blocked",
};

const severityLabels: Record<AuditSeverity, string> = {
  blocking: "Blocking",
  warning: "Needs attention",
  information: "Information",
};

const views: { id: WorkspaceView; label: string; icon: typeof FileCheck2 }[] = [
  { id: "assessment", label: "Assessment", icon: FileCheck2 },
  { id: "tasks", label: "My tasks", icon: ListChecks },
  { id: "audit", label: "Final audit", icon: ClipboardCheck },
];

export default function Workspace({
  id,
  view,
}: {
  id: string;
  view: WorkspaceView;
}) {
  const router = useRouter();
  const [application, setApplication] = useState<ClearpathApplication | null>(null);
  const [loadError, setLoadError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [filter, setFilter] = useState<EvidenceFilter>("all");
  const [saved, setSaved] = useState(true);
  const [runningAudit, setRunningAudit] = useState(false);

  useEffect(() => {
    try {
      const result = loadApplication(id);
      if (!result) {
        setLoadError("This workspace could not be found in this browser.");
        return;
      }
      setApplication(result);
    } catch {
      setLoadError("This browser could not read the saved workspace. The saved data may be unavailable or corrupted.");
    }
  }, [id]);

  function persist(next: ClearpathApplication) {
    setApplication(next);
    setSaved(false);
    try {
      saveApplication(next);
      setSaved(true);
      setStorageError("");
    } catch {
      setStorageError("Changes could not be saved. Your edits remain on screen but may be lost if you leave. Check browser storage and retry.");
    }
  }

  function updateRequirement(requirementId: string, status: ClearpathApplication["requirements"][number]["status"]) {
    if (!application) return;
    let explanation =
      "Status updated by you. This change is saved locally and has not been independently verified.";
    if (status === "not_applicable") {
      const reason = window.prompt("Why does this requirement not apply? Add a reason that you can verify with the opportunity provider.");
      if (!reason?.trim()) return;
      explanation = `Marked not applicable by you: ${reason.trim()}`;
    }
    const now = new Date().toISOString();
    persist({
      ...application,
      requirements: application.requirements.map((item) =>
        item.id === requirementId
          ? {
              ...item,
              status,
              explanation,
            }
          : item,
      ),
      updatedAt: now,
    });
  }

  function updateTask(taskId: string, status: ApplicationTask["status"]) {
    if (!application) return;
    persist({
      ...application,
      tasks: application.tasks.map((task) => task.id === taskId ? { ...task, status } : task),
      updatedAt: new Date().toISOString(),
    });
  }

  function runAudit() {
    if (!application) return;
    setRunningAudit(true);
    const audit = buildAudit(application);
    const updated = { ...application, audits: [...application.audits, audit] };
    try {
      saveApplication(updated);
      setApplication(updated);
      setStorageError("");
    } catch {
      setStorageError("The audit could not be saved. Check browser storage and try again.");
    } finally {
      setRunningAudit(false);
    }
  }

  const latestAudit = application?.audits.at(-1) ?? null;
  const auditIsStale = !!latestAudit && latestAudit.sourceUpdatedAt !== application?.updatedAt;

  if (loadError) {
    return (
      <main className="workspace-loading">
        <div className="loading-brand"><span className="brand-mark"><span /></span> clearpath</div>
        <div className="empty-panel"><TriangleAlert size={25} /><h1>Workspace unavailable</h1><p>{loadError}</p><Link className="button button-primary" href="/applications/new">Create a workspace <ArrowRight size={16} /></Link><Link className="back-link" href="/">Back to home</Link></div>
      </main>
    );
  }

  if (!application) {
    return <main className="workspace-loading"><div className="loading-brand"><span className="brand-mark"><span /></span> clearpath</div><div className="loading-card"><span className="loading-spinner" /><p>Opening your workspace…</p></div></main>;
  }

  const eligibility = deriveEligibility(application.requirements);
  const progress = taskProgress(application.tasks);
  const counts = {
    matched: application.requirements.filter((item) => item.status === "matched").length,
    missing: application.requirements.filter((item) => item.status === "missing").length,
    review: application.requirements.filter((item) => ["needs_verification", "conflict"].includes(item.status)).length,
  };
  const filteredRequirements = application.requirements.filter((requirement) => {
    if (filter === "missing") return requirement.status === "missing";
    if (filter === "review") return requirement.status === "needs_verification" || requirement.status === "conflict";
    if (filter === "matched") return requirement.status === "matched";
    return true;
  });

  const activeIndex = views.findIndex((item) => item.id === view);

  function removeWorkspace() {
    if (!application) return;
    if (!window.confirm(`Delete “${application.name}” from this browser? This cannot be undone.`)) return;
    try {
      deleteApplication(application.id);
      router.push("/");
    } catch {
      setStorageError("This workspace could not be deleted from browser storage.");
    }
  }
  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <Link href="/" className="wordmark"><span className="brand-mark"><span /></span><span>clearpath</span></Link>
        <div className="sidebar-label">YOUR WORKSPACE</div>
        <div className="sidebar-opportunity"><span className="opportunity-mark">{application.type === "scholarship" ? "S" : "I"}</span><span><b>{application.name}</b><small>{application.organization || (application.type === "scholarship" ? "Scholarship" : "Internship")}</small></span></div>
        <nav className="workflow-nav" aria-label="Application workflow">
          <div className="workflow-title">YOUR CHECKLIST <span>0{activeIndex + 1} / 03</span></div>
          {views.map(({ id: itemId, label, icon: Icon }, index) => (
            <Link key={itemId} className={`workflow-link ${view === itemId ? "selected" : ""} ${index < activeIndex ? "completed-step" : ""}`} href={`/applications/${id}/${itemId}`}>
              <span className="workflow-icon">{index < activeIndex ? <Check size={15} /> : <Icon size={15} />}</span><span>{label}</span><span className="step-dot">{index < activeIndex ? "✓" : `0${index + 1}`}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-progress"><div className="sidebar-progress-head"><span>Task progress</span><b>{progress.percent}%</b></div><div className="progress-track"><span style={{ width: `${progress.percent}%` }} /></div><small>{progress.completed} of {progress.total} tasks completed</small></div>
          <div className="sidebar-private"><LockKeyhole size={14} /><span>Saved only in this browser</span></div>
          <Link href="/" className="sidebar-home"><ArrowLeft size={14} /> Exit workspace</Link>
        </div>
      </aside>

      <main className="workspace-main">
        <header className="workspace-topbar">
          <div className="mobile-brand"><Link href="/" className="wordmark"><span className="brand-mark"><span /></span><span>clearpath</span></Link></div>
          <div className="topbar-breadcrumb"><span>My applications</span><span>/</span><b>{application.name}</b></div>
          <div className={`save-status ${saved ? "saved" : ""}`}><span />{saved ? "Saved on this device" : "Saving…"}</div>
        </header>
        <div className="mobile-workflow">
          {views.map(({ id: itemId, label }, index) => <Link key={itemId} className={view === itemId ? "current" : ""} href={`/applications/${id}/${itemId}`}><span>{index + 1}</span>{label}</Link>)}
        </div>
        <div className="workspace-content">
          {application.isDemo && <div className="demo-banner"><Info size={15} /><span><b>Guided demo</b> · Fictional example data. No uploaded files or AI analysis in this demo.</span><Link href="/applications/new">Create your own <ArrowRight size={14} /></Link></div>}
          {storageError && <div className="storage-error" role="alert"><TriangleAlert size={15} />{storageError}</div>}
          {view === "assessment" && (
            <section>
              <div className="workspace-page-heading">
                <div><div className="eyebrow">YOUR APPLICATION · STEP 01</div><h1>Here’s where things stand.</h1><p>A first look at the requirements and information in your workspace.</p></div>
                <div className="workspace-heading-action"><span className={`eligibility-pill ${eligibility}`}>{eligibility === "potential_issue" ? <TriangleAlert size={15} /> : eligibility === "likely_meets_stated_criteria" ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}{eligibilityLabels[eligibility]}</span></div>
              </div>
              <div className="summary-card">
                <div className="summary-icon"><FileCheck2 size={20} /></div>
                <div className="summary-main"><div className="summary-heading"><h2>{eligibility === "potential_issue" ? "There are items to address" : eligibility === "likely_meets_stated_criteria" ? "The information looks encouraging" : "A few details need your attention"}</h2><span className="preliminary-tag">PRELIMINARY REVIEW</span></div><p>This is a check against the details available here—not an official decision. A file name alone does not confirm its contents or validity.</p></div>
                <div className="summary-stats"><div><b>{counts.matched}</b><span>noted</span></div><div><b>{counts.review}</b><span>to check</span></div><div><b>{counts.missing}</b><span>missing</span></div></div>
              </div>
              <div className="applicant-context"><div className="context-symbol"><Info size={15} /></div><div><span>YOUR NOTES · {application.studentContext ? "USER-PROVIDED" : "NONE ADDED"}</span><p>{application.studentContext || "No applicant context has been added. Statuses marked for review remain unresolved."}</p></div></div>

              <div className="section-head-row"><div><div className="eyebrow">REQUIREMENT BY REQUIREMENT</div><h2>What the opportunity asks for</h2></div><span className="requirement-total">{application.requirements.length} items</span></div>
              <div className="filter-row" role="group" aria-label="Filter requirements">
                {([{ id: "all", label: "All items", count: application.requirements.length }, { id: "missing", label: "Missing", count: counts.missing }, { id: "review", label: "Needs a check", count: counts.review }, { id: "matched", label: "Evidence noted", count: counts.matched }] as const).map((item) => <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`filter-chip ${filter === item.id ? "active" : ""}`}>{item.label}<span>{item.count}</span></button>)}
              </div>

              <div className="requirements-list">
                {filteredRequirements.length === 0 ? <div className="empty-filter"><CheckCircle2 size={18} /><span>No {filter === "missing" ? "missing items" : filter === "matched" ? "noted evidence" : "items needing a check"} in this view.</span></div> : filteredRequirements.map((requirement, index) => (
                  <article className="requirement-card" key={requirement.id}>
                    <div className={`requirement-index status-${requirement.status}`}>{String(index + 1).padStart(2, "0")}</div>
                    <div className="requirement-content">
                      <div className="requirement-title-row"><h3>{requirement.text}</h3><span className={`status-badge ${requirement.status}`}><span />{evidenceLabels[requirement.status]}</span></div>
                      <div className="requirement-meta"><span className={`kind-label ${requirement.kind}`}>{requirement.kind === "mandatory" ? "Required" : requirement.kind === "preferred" ? "Preferred" : "Needs review"}</span><span className="meta-divider" /><span>{requirement.explanation}</span></div>
                      <blockquote><span className="quote-mark">“</span><span>{requirement.sourceQuote}</span><cite><FileText size={12} /> {requirement.sourceLocation}</cite></blockquote>
                      <div className="requirement-footer"><span><b>Next step</b> {requirement.action}</span><label className="status-edit">Update status<select aria-label={`Update status for ${requirement.text}`} value={requirement.status} onChange={(event) => updateRequirement(requirement.id, event.target.value as typeof requirement.status)}><option value="matched">Evidence noted</option><option value="missing">Missing</option><option value="needs_verification">Needs a check</option><option value="conflict">Conflict</option><option value="not_applicable">Not applicable</option></select></label></div>
                    </div>
                  </article>
                ))}
              </div>
              <div className="bottom-callout"><div className="callout-mark"><ShieldCheck size={18} /></div><div><b>Keep the evidence in view</b><p>Confirm each item with the original opportunity provider. This workspace cannot verify eligibility.</p></div><Link href={`/applications/${id}/tasks`} className="button button-primary">Make a plan <ArrowRight size={15} /></Link></div>
            </section>
          )}

          {view === "tasks" && (
            <section>
              <div className="workspace-page-heading tasks-heading">
                <div><div className="eyebrow">YOUR APPLICATION · STEP 02</div><h1>Small steps add up.</h1><p>Your checklist is based on items that still need a decision or follow-up.</p></div>
                <Link href={`/applications/${id}/audit`} className="button button-primary">Go to final audit <ArrowRight size={15} /></Link>
              </div>
              <div className="task-overview">
                <div className="task-progress-ring" style={{ background: `conic-gradient(#709279 ${progress.percent}%, #e8ede8 0)` }}><span><b>{progress.percent}<small>%</small></b><i>done</i></span></div>
                <div className="task-overview-copy"><div className="eyebrow">YOUR PROGRESS</div><h2>{progress.completed} of {progress.total} steps complete</h2><p>Mark a step complete when you’ve taken it. That does not independently verify your evidence.</p></div>
                <div className="task-counts"><div><span className="count-dot open" />{progress.remaining} remaining</div><div><span className="count-dot blocked" />{progress.blocked} blocked</div></div>
              </div>
              <div className="section-head-row task-list-heading"><div><div className="eyebrow">PERSONALIZED CHECKLIST</div><h2>What to do next</h2></div><span className="requirement-total">{application.tasks.length} tasks</span></div>
              {application.tasks.length === 0 ? <div className="empty-state"><CheckCircle2 size={23} /><h3>No checklist items yet</h3><p>Add requirements to create actions from your opportunity details.</p><Link href={`/applications/${id}/assessment`} className="text-link">Review requirements <ArrowRight size={15} /></Link></div> : <div className="task-list">
                {application.tasks.map((task) => {
                  const requirement = application.requirements.find((item) => item.id === task.requirementId);
                  return <article className={`task-card ${task.status === "completed" ? "task-done" : ""}`} key={task.id}>
                    <button type="button" className={`task-check ${task.status === "completed" ? "checked" : ""}`} onClick={() => updateTask(task.id, task.status === "completed" ? "todo" : "completed")} aria-label={`${task.status === "completed" ? "Reopen" : "Complete"} task: ${task.title}`}>{task.status === "completed" && <Check size={15} />}</button>
                    <div className="task-card-body"><div className="task-topline"><span className={`priority-label ${task.priority}`}><Flag size={12} /> {task.priority} priority</span><span className={`task-status ${task.status}`}>{taskLabels[task.status]}</span></div><h3>{task.title}</h3><p>{task.description}</p>{requirement && <div className="task-source"><FileText size={13} /><span>Linked to: {requirement.text}</span></div>}</div>
                    <label className="task-select-label">Status<select aria-label={`Task status: ${task.title}`} value={task.status} onChange={(event) => updateTask(task.id, event.target.value as ApplicationTask["status"])}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="blocked">Blocked</option></select></label>
                  </article>;
                })}
              </div>}
              <div className="bottom-callout"><div className="callout-mark"><Clock3 size={18} /></div><div><b>Progress is yours to confirm</b><p>ClearPath records the task status you choose; it doesn’t contact recommenders or verify documents.</p></div><Link href={`/applications/${id}/assessment`} className="button button-secondary">Back to assessment <ArrowLeft size={15} /></Link></div>
            </section>
          )}

          {view === "audit" && (
            <AuditView application={application} audit={latestAudit} stale={auditIsStale} running={runningAudit} onRun={runAudit} />
          )}
        </div>
        <footer className="workspace-footer"><span><LockKeyhole size={13} /> Stored in this browser only</span><span>Preparation support · Not an official eligibility decision</span><button type="button" onClick={removeWorkspace}><Trash2 size={12} /> Delete workspace</button></footer>
      </main>
    </div>
  );
}

function AuditView({
  application,
  audit,
  stale,
  running,
  onRun,
}: {
  application: ClearpathApplication;
  audit: AuditRun | null;
  stale: boolean;
  running: boolean;
  onRun: () => void;
}) {
  const readiness = useMemo(() => {
    const open = application.requirements.filter(
      (item) => item.status !== "matched",
    ).length;
    return { open, total: application.requirements.length };
  }, [application.requirements]);

  return (
    <section>
      <div className="workspace-page-heading audit-heading">
        <div><div className="eyebrow">YOUR APPLICATION · STEP 03</div><h1>Before you submit, take a breath.</h1><p>A final review of what is recorded in this workspace right now.</p></div>
        <button type="button" className="button button-primary" onClick={onRun} disabled={running}>{running ? "Checking saved details…" : audit ? "Run audit again" : "Run readiness audit"}{running ? <RefreshCw size={15} className="spin-icon" /> : <ArrowRight size={15} />}</button>
      </div>
      {!audit ? <div className="audit-start-card"><div className="audit-start-icon"><ClipboardCheck size={23} /></div><div><h2>Your final check is ready</h2><p>We’ll review saved requirement statuses and task progress. The result will not verify your documents or predict an outcome.</p><div className="audit-scope"><span><CheckCircle2 size={14} /> {readiness.total} saved requirements</span><span><ListChecks size={14} /> {application.tasks.length} checklist tasks</span></div></div></div> : (
        <>
          {stale && <div className="stale-banner"><TriangleAlert size={16} /><span><b>This audit is out of date.</b> Your requirements or tasks have changed since it ran.</span><button type="button" onClick={onRun}>Run again <ArrowRight size={14} /></button></div>}
          <div className={`audit-result ${audit.outcome}`}>
            <div className="audit-result-icon">{audit.outcome === "incomplete" ? <TriangleAlert size={22} /> : audit.outcome === "needs_review" ? <Clock3 size={22} /> : <CheckCircle2 size={22} />}</div>
            <div><div className="eyebrow">READINESS BASED ON CHECKS COMPLETED</div><h2>{audit.outcome === "incomplete" ? "Some required items are still open" : audit.outcome === "needs_review" ? "A few details need your attention" : "Ready based on the checks completed"}</h2><p>{audit.outcome === "ready" ? "No open items were found in the saved checks. Confirm the official instructions before submitting." : "Use these findings as a preparation checklist. They are not a decision by the scholarship or internship provider."}</p></div>
            <span className="audit-run-date">{new Date(audit.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
          </div>
          <div className="audit-summary-row"><div><b>{audit.findings.filter((finding) => finding.severity === "blocking").length}</b><span>blocking</span></div><div><b>{audit.findings.filter((finding) => finding.severity === "warning").length}</b><span>needs attention</span></div><div><b>{readiness.open}</b><span>open checks</span></div></div>
          <div className="section-head-row audit-findings-heading"><div><div className="eyebrow">YOUR REVIEW</div><h2>Items to review</h2></div><span className="requirement-total">{audit.findings.length} findings</span></div>
          <div className="audit-findings">
            {audit.findings.length === 0 ? <div className="empty-state"><CheckCircle2 size={22} /><h3>No findings</h3><p>No open items were present in the checks completed.</p></div> : audit.findings.map((finding) => <AuditFindingCard finding={finding} applicationId={application.id} key={finding.id} />)}
          </div>
          <div className="audit-disclaimer"><ShieldCheck size={17} /><p><b>What this audit can’t tell you</b><br />This is a document-preparation check based on the details saved here. It cannot determine official eligibility, guarantee acceptance, or submit your application.</p></div>
        </>
      )}
      <div className="bottom-callout"><div className="callout-mark"><FileCheck2 size={18} /></div><div><b>{application.name}</b><p>{application.deadline ? `Deadline entered: ${new Date(`${application.deadline}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}` : "No deadline entered"} · Always confirm dates on the official source.</p></div><Link href={`/applications/${application.id}/assessment`} className="button button-secondary">Review details <ArrowUpRight size={15} /></Link></div>
    </section>
  );
}

function AuditFindingCard({
  finding,
  applicationId,
}: {
  finding: AuditFinding;
  applicationId: string;
}) {
  const icon = finding.severity === "blocking" ? <TriangleAlert size={16} /> : finding.severity === "warning" ? <Clock3 size={16} /> : <Info size={16} />;
  return (
    <article className={`audit-finding ${finding.severity}`}>
      <div className="finding-icon">{icon}</div>
      <div className="finding-content"><div className="finding-top"><span>{severityLabels[finding.severity]}</span>{finding.requirementId && <Link href={`/applications/${applicationId}/assessment`}>View requirement <ArrowUpRight size={13} /></Link>}</div><h3>{finding.title}</h3><p>{finding.detail}</p><div className="finding-action"><b>Suggested next step</b><span>{finding.action}</span></div></div>
    </article>
  );
}
