export type OpportunityType = "scholarship" | "internship";
export type RequirementKind = "mandatory" | "preferred" | "conditional" | "unclear";
export type EvidenceStatus =
  | "matched"
  | "missing"
  | "needs_verification"
  | "conflict"
  | "not_applicable";
export type TaskStatus = "todo" | "in_progress" | "completed" | "blocked";
export type AuditSeverity = "blocking" | "warning" | "information";

export interface Requirement {
  id: string;
  text: string;
  kind: RequirementKind;
  status: EvidenceStatus;
  explanation: string;
  action: string;
  sourceQuote: string;
  sourceLocation: string;
}

export interface ApplicationTask {
  id: string;
  requirementId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: "high" | "medium" | "low";
}

export interface AuditFinding {
  id: string;
  severity: AuditSeverity;
  title: string;
  detail: string;
  action: string;
  requirementId?: string;
}

export interface AuditRun {
  id: string;
  createdAt: string;
  sourceUpdatedAt: string;
  outcome: "incomplete" | "needs_review" | "ready";
  findings: AuditFinding[];
}

export interface ClearpathApplication {
  id: string;
  name: string;
  type: OpportunityType;
  organization: string;
  deadline: string;
  studentContext: string;
  sourceText: string;
  sourceName: string;
  supportingFiles: string[];
  requirements: Requirement[];
  tasks: ApplicationTask[];
  audits: AuditRun[];
  createdAt: string;
  updatedAt: string;
  isDemo: boolean;
}

export const STORAGE_KEY = "clearpath.application.v1";

export const demoApplication: ClearpathApplication = {
  id: "demo",
  name: "Future Leaders Scholarship",
  type: "scholarship",
  organization: "Northstar Foundation",
  deadline: "2026-11-30",
  studentContext:
    "Sample student profile: enrolled full-time in an undergraduate programme. Current GPA and official enrolment confirmation have not been supplied.",
  sourceName: "Northstar scholarship notice.pdf",
  sourceText:
    "Applicants must be enrolled full-time in an accredited undergraduate programme.\nApplicants must have a cumulative GPA of at least 3.2 on a 4.0 scale.\nA current academic transcript must be included with the application.\nOne letter of recommendation from a faculty member is required.\nApplications must be submitted by November 30, 2026.",
  supportingFiles: ["Student transcript.pdf", "Personal statement.docx"],
  requirements: [
    {
      id: "demo-enrolment",
      text: "Be enrolled full-time in an accredited undergraduate programme.",
      kind: "mandatory",
      status: "matched",
      explanation:
        "The fictional sample profile states full-time enrolment. Confirm the institution and current enrolment against an official record.",
      action: "Confirm your current enrolment details.",
      sourceQuote:
        "Applicants must be enrolled full-time in an accredited undergraduate programme.",
      sourceLocation: "Opportunity notice · Eligibility",
    },
    {
      id: "demo-gpa",
      text: "Have a cumulative GPA of at least 3.2 on a 4.0 scale.",
      kind: "mandatory",
      status: "needs_verification",
      explanation:
        "A transcript is listed, but its contents have not been inspected in this demo. The GPA threshold is not verified.",
      action: "Check your transcript and confirm your GPA scale.",
      sourceQuote:
        "Applicants must have a cumulative GPA of at least 3.2 on a 4.0 scale.",
      sourceLocation: "Opportunity notice · Eligibility",
    },
    {
      id: "demo-transcript",
      text: "Include a current academic transcript.",
      kind: "mandatory",
      status: "matched",
      explanation:
        "A file with a transcript-like name is attached. Its freshness and contents have not been checked.",
      action: "Verify the transcript is current and complete.",
      sourceQuote:
        "A current academic transcript must be included with the application.",
      sourceLocation: "Opportunity notice · Required documents",
    },
    {
      id: "demo-letter",
      text: "Include one letter of recommendation from a faculty member.",
      kind: "mandatory",
      status: "missing",
      explanation:
        "No recommendation letter is listed among the supplied files.",
      action: "Ask a faculty member for a recommendation letter.",
      sourceQuote:
        "One letter of recommendation from a faculty member is required.",
      sourceLocation: "Opportunity notice · Required documents",
    },
    {
      id: "demo-deadline",
      text: "Submit the application by November 30, 2026.",
      kind: "mandatory",
      status: "needs_verification",
      explanation:
        "The notice states a deadline. Confirm the time zone and submission portal instructions with the foundation.",
      action: "Confirm the submission time and portal instructions.",
      sourceQuote:
        "Applications must be submitted by November 30, 2026.",
      sourceLocation: "Opportunity notice · Submission",
    },
  ],
  tasks: [
    {
      id: "demo-task-gpa",
      requirementId: "demo-gpa",
      title: "Verify your GPA against the 3.2 threshold",
      description: "Check the cumulative GPA and scale shown on your current transcript.",
      status: "todo",
      priority: "high",
    },
    {
      id: "demo-task-letter",
      requirementId: "demo-letter",
      title: "Request a faculty recommendation",
      description: "Ask a faculty member and allow enough time for them to submit the letter.",
      status: "in_progress",
      priority: "high",
    },
    {
      id: "demo-task-transcript",
      requirementId: "demo-transcript",
      title: "Confirm your transcript is current",
      description: "Make sure the attached transcript is official, readable, and up to date.",
      status: "todo",
      priority: "medium",
    },
    {
      id: "demo-task-deadline",
      requirementId: "demo-deadline",
      title: "Check the submission deadline details",
      description: "Confirm the portal closing time and any time-zone details.",
      status: "todo",
      priority: "medium",
    },
  ],
  audits: [],
  createdAt: "2026-10-01T09:00:00.000Z",
  updatedAt: "2026-10-19T09:00:00.000Z",
  isDemo: true,
};

export function deriveEligibility(
  requirements: Requirement[],
): "likely_meets_stated_criteria" | "potential_issue" | "insufficient_information" {
  const mandatory = requirements.filter((item) => item.kind === "mandatory");
  if (mandatory.length === 0) return "insufficient_information";
  if (
    mandatory.some(
      (item) => item.status === "conflict" || item.status === "missing",
    )
  ) {
    return "potential_issue";
  }
  if (
    mandatory.some(
      (item) =>
        item.status === "needs_verification" ||
        item.status === "not_applicable",
    )
  ) {
    return "insufficient_information";
  }
  return "likely_meets_stated_criteria";
}

export function taskProgress(tasks: ApplicationTask[]) {
  const completed = tasks.filter((task) => task.status === "completed").length;
  const blocked = tasks.filter((task) => task.status === "blocked").length;
  return {
    completed,
    blocked,
    total: tasks.length,
    remaining: tasks.length - completed,
    percent: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
  };
}

export function buildAudit(application: ClearpathApplication): AuditRun {
  const findings: AuditFinding[] = [];
  for (const requirement of application.requirements) {
    if (requirement.status === "missing" && requirement.kind === "mandatory") {
      findings.push({
        id: `finding-${requirement.id}`,
        severity: "blocking",
        title: requirement.text,
        detail: "This mandatory item is currently recorded as missing.",
        action: requirement.action,
        requirementId: requirement.id,
      });
      continue;
    }
    if (
      requirement.status === "needs_verification" ||
      requirement.status === "conflict" ||
      (requirement.status === "not_applicable" &&
        requirement.kind === "mandatory")
    ) {
      findings.push({
        id: `finding-${requirement.id}`,
        severity: "warning",
        title: requirement.text,
        detail:
          requirement.status === "conflict"
            ? "The available information contains an unresolved conflict."
            : requirement.status === "not_applicable"
              ? "You marked this mandatory item as not applicable; confirm that interpretation with the opportunity provider."
              : "The available evidence does not yet confirm this item.",
        action: requirement.action,
        requirementId: requirement.id,
      });
    }
  }

  const unresolvedTasks = application.tasks.filter(
    (task) => task.status !== "completed",
  );
  if (application.requirements.length === 0) {
    findings.push({
      id: "no-requirements",
      severity: "warning",
      title: "No requirements are available to check",
      detail: "This workspace has no requirement lines to compare against the application.",
      action: "Add and review the official opportunity requirements.",
    });
  }
  for (const task of unresolvedTasks) {
    const alreadyCovered = findings.some(
      (finding) => finding.requirementId === task.requirementId,
    );
    if (alreadyCovered) continue;
    const requirement = application.requirements.find(
      (item) => item.id === task.requirementId,
    );
    findings.push({
      id: `finding-${task.id}`,
      severity: "warning",
      title: task.title,
      detail: `This checklist task is ${task.status === "blocked" ? "blocked" : "not complete"}.`,
      action: task.description,
      requirementId: requirement?.id,
    });
  }

  if (findings.length === 0 && unresolvedTasks.length === 0) {
    findings.push({
      id: "all-reviewed",
      severity: "information",
      title: "No open issues in the checks completed",
      detail:
        "This is a completeness check based on the information you entered, not an eligibility decision by the provider.",
      action: "Review the official instructions before submitting.",
    });
  }

  return {
    id: `audit-${Date.now()}`,
    createdAt: new Date().toISOString(),
    sourceUpdatedAt: application.updatedAt,
    outcome: findings.some((finding) => finding.severity === "blocking")
      ? "incomplete"
      : findings.some((finding) => finding.severity === "warning")
        ? "needs_review"
        : "ready",
    findings,
  };
}

export function extractManualRequirements(
  sourceText: string,
): Requirement[] {
  return sourceText
    .split(/\r?\n/)
    .map((line, index) => ({ text: line.trim(), lineNumber: index + 1 }))
    .filter(({ text }) => Boolean(text))
    .map(({ text, lineNumber }) => {
      const isMandatory =
        /\b(must|required|minimum|at least|submit by)\b/i.test(text) &&
        !/\bnot required\b/i.test(text);
      const kind: RequirementKind = isMandatory
        ? "mandatory"
        : /\b(preferred|preferable)\b/i.test(text)
          ? "preferred"
          : /\b(if|unless|only when|conditional)\b/i.test(text)
            ? "conditional"
            : "unclear";
      const status: EvidenceStatus = "needs_verification";
      return {
        id: `req-${lineNumber}`,
        text,
        kind,
        status,
        explanation:
          "Captured from text you supplied. ClearPath has not independently checked the document or your evidence.",
        action: "Review this requirement and confirm what evidence is needed.",
        sourceQuote: text,
        sourceLocation: `User-provided text · Line ${lineNumber}`,
      };
    });
}
