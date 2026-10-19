import assert from "node:assert/strict";
import test from "node:test";
import {
  ApplicationTask,
  buildAudit,
  deriveEligibility,
  demoApplication,
  extractManualRequirements,
  Requirement,
  taskProgress,
} from "../lib/domain";

test("keeps unresolved mandatory requirements as insufficient information", () => {
  const requirements: Requirement[] = [
    { ...demoApplication.requirements[0], status: "needs_verification" },
  ];
  assert.equal(deriveEligibility(requirements), "insufficient_information");
});

test("does not treat a mandatory requirement marked not applicable as cleared", () => {
  const requirements: Requirement[] = [
    { ...demoApplication.requirements[0], status: "not_applicable" },
  ];
  assert.equal(deriveEligibility(requirements), "insufficient_information");
  const audit = buildAudit({
    ...demoApplication,
    requirements,
    tasks: [],
  });
  assert.equal(audit.outcome, "needs_review");
  assert.match(audit.findings[0].detail, /confirm that interpretation/);
});

test("warns when there are no requirements to audit", () => {
  const audit = buildAudit({
    ...demoApplication,
    requirements: [],
    tasks: [],
  });
  assert.equal(audit.outcome, "needs_review");
  assert.equal(audit.findings[0].id, "no-requirements");
});

test("flags a missing mandatory item without calling the applicant ineligible", () => {
  const requirements: Requirement[] = [
    { ...demoApplication.requirements[3], status: "missing" },
  ];
  assert.equal(deriveEligibility(requirements), "potential_issue");
  const audit = buildAudit({
    ...demoApplication,
    requirements,
    tasks: [],
  });
  assert.equal(audit.outcome, "incomplete");
  assert.equal(audit.findings[0].severity, "blocking");
  assert.match(audit.findings[0].action, /faculty member/);
});

test("derives task progress from actual saved states", () => {
  const tasks: ApplicationTask[] = [
    { ...demoApplication.tasks[0], status: "completed" },
    { ...demoApplication.tasks[1], status: "blocked" },
  ];
  assert.deepEqual(taskProgress(tasks), {
    completed: 1,
    blocked: 1,
    total: 2,
    remaining: 1,
    percent: 50,
  });
});

test("keeps an audit open when an unrelated checklist task is unfinished", () => {
  const task = {
    id: "follow-up",
    requirementId: "unrelated",
    title: "Confirm submission portal details",
    description: "Check the provider's official page.",
    status: "todo" as const,
    priority: "medium" as const,
  };
  const audit = buildAudit({
    ...demoApplication,
    requirements: [],
    tasks: [task],
  });
  assert.equal(audit.outcome, "needs_review");
  assert.equal(audit.findings[0].severity, "warning");
});

test("preserves user-provided source text as the citation", () => {
  const source = "Applicants must submit a current transcript.\n\nDeadline: 30 November.";
  const requirements = extractManualRequirements(source);
  assert.equal(requirements.length, 2);
  assert.equal(requirements[0].sourceQuote, "Applicants must submit a current transcript.");
  assert.equal(requirements[0].sourceLocation, "User-provided text · Line 1");
  assert.equal(requirements[1].sourceLocation, "User-provided text · Line 3");
  assert.ok(
    requirements.every(
      (requirement) => requirement.status === "needs_verification",
    ),
  );
});
