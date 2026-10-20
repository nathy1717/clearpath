import {
  ApplicationTask,
  AuditFinding,
  AuditRun,
  ClearpathApplication,
  Requirement,
} from "./domain";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasStringFields(
  value: Record<string, unknown>,
  fields: string[],
): boolean {
  return fields.every((field) => typeof value[field] === "string");
}

function isRequirement(value: unknown): value is Requirement {
  if (!isRecord(value) || !hasStringFields(value, [
    "id", "text", "explanation", "action", "sourceQuote", "sourceLocation",
  ])) return false;
  const validSuggestion = value.suggestedStatus === undefined
    || ["possible_match", "not_found", "needs_review"].includes(String(value.suggestedStatus));
  const validEvidence = value.evidenceQuote === undefined
    || typeof value.evidenceQuote === "string";
  const validEvidenceSource = value.evidenceSourceName === undefined
    || typeof value.evidenceSourceName === "string";
  return validSuggestion && validEvidence && validEvidenceSource
    && ["mandatory", "preferred", "conditional", "unclear"].includes(String(value.kind))
    && ["matched", "missing", "needs_verification", "conflict", "not_applicable"].includes(String(value.status));
}

function isTask(value: unknown): value is ApplicationTask {
  if (!isRecord(value) || !hasStringFields(value, [
    "id", "requirementId", "title", "description",
  ])) return false;
  return ["todo", "in_progress", "completed", "blocked"].includes(String(value.status))
    && ["high", "medium", "low"].includes(String(value.priority));
}

function isAuditFinding(value: unknown): value is AuditFinding {
  if (!isRecord(value) || !hasStringFields(value, [
    "id", "title", "detail", "action",
  ])) return false;
  return ["blocking", "warning", "information"].includes(String(value.severity))
    && (value.requirementId === undefined || typeof value.requirementId === "string");
}

function isAudit(value: unknown): value is AuditRun {
  if (!isRecord(value) || !hasStringFields(value, [
    "id", "createdAt", "sourceUpdatedAt",
  ]) || !Array.isArray(value.findings)) return false;
  return ["incomplete", "needs_review", "ready"].includes(String(value.outcome))
    && value.findings.every(isAuditFinding);
}

export function isClearpathApplication(
  value: unknown,
): value is ClearpathApplication {
  if (!isRecord(value) || !hasStringFields(value, [
    "id", "name", "organization", "deadline", "studentContext", "sourceText",
    "sourceName", "createdAt", "updatedAt",
  ])) return false;
  return typeof value.name === "string"
    && value.name.trim().length >= 3
    && ["scholarship", "internship"].includes(String(value.type))
    && Array.isArray(value.supportingFiles)
    && value.supportingFiles.every((file) => typeof file === "string")
    && Array.isArray(value.requirements)
    && value.requirements.every(isRequirement)
    && Array.isArray(value.tasks)
    && value.tasks.every(isTask)
    && Array.isArray(value.audits)
    && value.audits.every(isAudit)
    && typeof value.isDemo === "boolean";
}
