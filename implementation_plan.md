# ClearPath — Coding-Agent Implementation Plan

Implementation specification v1.0 · Web application · Hackathon MVP

The implementation strategy is to build one complete, trustworthy application-preparation workflow, not a collection of loosely connected AI features.

ClearPath will take a student from an opportunity notice to a source-linked requirements assessment, a personalized checklist, and a final readiness audit. Every important AI-generated finding must be traceable to evidence or explicitly marked uncertain.

The coding agent should implement the project in small, verifiable phases. It must not start by generating every screen at once.

## 1. Product scope and technical decisions

Primary outcome

A student can understand the requirements of a scholarship or internship, compare them against supplied evidence, identify outstanding tasks, and check the application before submitting it externally.

Implementation strategy

Responsive web application, reusable design system, structured AI pipeline, explicit application state, and automated tests for the critical workflow.

Non-negotiable constraint

Never fabricate requirements, source references, user qualifications, processing progress, or successful analysis results.

### Recommended stack

Use this as the default stack unless the existing repository already has a functioning equivalent. Inspect the repository before changing dependencies or replacing its architecture.

| Layer                    | Recommendation                                                                    |
| ------------------------ | --------------------------------------------------------------------------------- |
| Framework                | Next.js with App Router and TypeScript                                            |
| Styling                  | Tailwind CSS with centralized design tokens                                       |
| UI primitives            | Accessible component primitives, with shadcn/ui where useful                      |
| Forms and validation     | React Hook Form and Zod                                                           |
| Document processing      | Server-side PDF and DOCX text extraction, with explicit unsupported-file handling |
| AI integration           | Server-side model API with schema-constrained output and retry/error handling     |
| Persistence              | PostgreSQL with Prisma, or the existing project database                          |
| File storage             | Private object storage, or secure temporary storage for the MVP                   |
| Unit and component tests | Vitest and React Testing Library                                                  |
| End-to-end tests         | Playwright                                                                        |

These are recommendations, not prerequisites to the product definition. The coding agent should first inspect the existing stack and reuse working infrastructure where reasonable.

Security requirements: model API keys must remain server-side; uploaded files must not be publicly accessible; file type and size must be validated on the server; and authorization must be checked on every operation that reads or modifies private application data.

If time constraints require a simpler persistence layer, keep the data-access interface replaceable rather than coupling business logic directly to browser storage.

## 2. Project structure

Use a feature-oriented structure. UI components, business logic, AI processing, and persistence should be separated so changes to the model provider do not require rewriting the interface.

```
clearpath/
├── app/
│   ├── (marketing)/
│   │   └── page.tsx
│   ├── applications/
│   │   ├── new/page.tsx
│   │   └── [applicationId]/
│   │       ├── layout.tsx
│   │       ├── assessment/page.tsx
│   │       ├── tasks/page.tsx
│   │       └── audit/page.tsx
│   ├── api/
│   │   ├── applications/route.ts
│   │   ├── applications/[applicationId]/route.ts
│   │   ├── documents/route.ts
│   │   ├── analysis/route.ts
│   │   └── audit/route.ts
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   ├── navigation/
│   ├── documents/
│   ├── requirements/
│   ├── assessment/
│   ├── tasks/
│   └── audit/
├── features/
│   └── applications/
│       ├── components/
│       ├── hooks/
│       ├── schemas/
│       ├── services/
│       ├── types/
│       └── utils/
├── lib/
│   ├── ai/
│   │   ├── provider.ts
│   │   ├── prompts.ts
│   │   ├── schemas.ts
│   │   ├── extraction.ts
│   │   ├── matching.ts
│   │   ├── auditing.ts
│   │   └── citations.ts
│   ├── documents/
│   │   ├── validation.ts
│   │   ├── pdf.ts
│   │   ├── docx.ts
│   │   └── text-normalization.ts
│   ├── db/
│   ├── storage/
│   ├── security/
│   └── utils.ts
├── prisma/
│   └── schema.prisma
├── tests/
│   ├── fixtures/
│   ├── unit/
│   ├── integration/
│   ├── evaluation/
│   └── e2e/
├── public/
├── .env.example
├── package.json
└── README.md
```

This is a logical target, not a mandate to create every file immediately. Create modules when their functionality is implemented.

### Architectural boundaries

- `app/` handles routes, layouts, and HTTP boundaries.
- `components/` contains reusable presentation components.
- `features/applications/` contains application-specific UI, state, schemas, and orchestration.
- `lib/documents/` extracts text and preserves source locations.
- `lib/ai/` performs structured extraction, evidence matching, and auditing.
- `lib/db/` and `lib/storage/` manage persistence and files.
- `tests/` contains deterministic test cases and evaluation fixtures.

Never put AI provider calls, database credentials, or private file access inside client components.

## 3. Design tokens

The interface must use a single source of truth for colour, typography, spacing, borders, radii, shadows, and responsive breakpoints.

### Colour tokens

Brand primary

\#173F35 · Primary buttons, selected navigation, key actions

&#x20;Copy

Brand subtle

\#E8F1EC · Subtle highlighted areas and selected states

&#x20;Copy

Page background

\#F7F8F5 · Application workspace background

&#x20;Copy

Surface

\#FFFFFF · Cards, panels, dialogs and forms

&#x20;Copy

Text primary

\#252B28 · Headings and main body text

&#x20;Copy

Text secondary

\#6B746F · Supporting information and helper text

&#x20;Copy

Border

\#E1E5E0 · Dividers, input borders, card outlines

&#x20;Copy

Semantic status tokens:

| Token         | Background | Foreground | Meaning                         |
| ------------- | ---------- | ---------- | ------------------------------- |
| Success       | `#E4F3E8`  | `#21663B`  | Confirmed or completed          |
| Warning       | `#FFF1D6`  | `#855A13`  | Uncertain or needs review       |
| Danger        | `#FBE7E5`  | `#9B3028`  | Issue or potential disqualifier |
| Informational | `#E8F0FA`  | `#285A8E`  | Guidance or neutral information |

Status must never depend on colour alone; include a text label and, where appropriate, an icon.

### Typography, spacing and shape

```
:root {
  --color-brand: #173F35;
  --color-brand-subtle: #E8F1EC;
  --color-page: #F7F8F5;
  --color-surface: #FFFFFF;
  --color-text: #252B28;
  --color-text-muted: #6B746F;
  --color-border: #E1E5E0;

  --font-sans: "Inter", sans-serif;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;

  --radius-control: 8px;
  --radius-card: 12px;
  --radius-panel: 16px;

  --shadow-popover: 0 8px 24px rgb(37 43 40 / 8%);
}
```

The coding agent should implement these as actual framework tokens or CSS variables and reference them consistently.

Typography scale:

| Usage              | Desktop size | Weight |
| ------------------ | ------------ | ------ |
| Marketing headline | 44 px        | 600    |
| Page title         | 32 px        | 600    |
| Section title      | 24 px        | 600    |
| Card title         | 17–18 px     | 600    |
| Body               | 15–16 px     | 400    |
| Helper text        | 13–14 px     | 400    |

Use fluid typography where useful. Do not reduce text below comfortable readability just to fit more content on screen.

## 4. Shared layout and navigation

The guided workspace must make the current task, overall progress, and next action obvious.

## ClearPath

Application workspace

Step 3 of 4

WORKFLOW

Requirements

Assessment

My tasks

Final audit

CURRENT STEP

## Review your assessment

Check which requirements are supported by your documents and which still need attention.

Academic transcript

Evidence found

Proof of enrolment

Needs verification

Review requirements

Illustrative layout only. The production UI must derive progress and status from real application data.

### Layout requirements

- Marketing pages use a centered content container with a maximum width of approximately 1200 px.
- Application workspace uses a persistent step indicator and a clear content hierarchy.
- On desktop, use a restrained sidebar or compact workflow navigation, with the primary content in the centre.
- On mobile, replace the full sidebar with compact progress navigation or a collapsible step menu.
- Keep the main CTA visually dominant without making secondary actions inaccessible.
- Use breadcrumbs or an application title to preserve context.
- Show save status only when persistence is confirmed by the server.

Reusable layout components:

- `AppShell`
- `MarketingHeader`
- `WorkspaceHeader`
- `WorkflowStepper`
- `PageContainer`
- `PageHeader`
- `ContentPanel`
- `StickyActionBar`
- `MobileStepNavigation`
- `ConfirmationDialog`
- `ToastProvider`

## 5. Reusable component specifications

Build reusable components before implementing all the screens. The coding agent should not create a different upload widget, status badge, or card implementation on every page.

| Component            | Required API or behaviour                                                | Acceptance criteria                                                        |
| -------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `Button`             | Variants: primary, secondary, outline, ghost, danger. Sizes: sm, md, lg. | Keyboard accessible; loading and disabled states; no duplicate submission. |
| `StatusBadge`        | Typed status and optional icon.                                          | Consistent semantic colours and readable label.                            |
| `FileDropzone`       | Accepted types, maximum size, multiple-file setting, `onFilesSelected`.  | File picker, drag/drop, validation, focus state and error feedback.        |
| `UploadedFileRow`    | File metadata, upload state, retry, remove.                              | State reflects actual upload operation; errors are recoverable.            |
| `WorkflowStepper`    | Ordered steps, current step, completed steps.                            | Current position is clear; completed steps reflect persisted state.        |
| `RequirementCard`    | Requirement, source, evidence status, explanation, next action.          | Source can be opened; status and action are visible.                       |
| `SourceCitation`     | Document name, page/section, excerpt.                                    | Opens the exact source location when available.                            |
| `EligibilitySummary` | Assessment result, rationale, unresolved items.                          | No unsupported definitive eligibility claim.                               |
| `EvidenceStatus`     | Matched, missing, needs verification, conflict, not applicable.          | Consistent labels and icons across all screens.                            |
| `TaskItem`           | Title, reason, priority, status, evidence, completion action.            | Completion persists; users can reopen tasks.                               |
| `ProgressSummary`    | Derived task totals and completion counts.                               | Counts are calculated from actual tasks, not hardcoded.                    |
| `EmptyState`         | Message, explanation, next action.                                       | Helps users recover or start the appropriate task.                         |
| `ErrorState`         | Error message, recovery action, optional technical reference.            | No leaked stack traces, secrets, or internal prompts.                      |
| `LoadingState`       | Real processing stage and accessible status announcement.                | Does not invent progress or falsely indicate completion.                   |
| `AuditFinding`       | Severity, description, source, affected item, recommended action.        | Every finding is traceable or marked uncertain.                            |
| `ConfirmDialog`      | Title, consequence, confirm and cancel actions.                          | Destructive actions require deliberate confirmation.                       |

### Component engineering rules

- Prefer controlled inputs when their state affects the application workflow.
- Keep components focused: presentation components should not call the AI provider directly.
- Use shared schemas and typed props rather than duplicating string literals for statuses.
- Make asynchronous operations cancellable where feasible and prevent stale responses from overwriting newer state.
- Use semantic HTML and accessible dialog, menu, and notification patterns.
- Do not over-abstract simple components; abstraction should improve consistency or testability.

## 6. Screen-by-screen implementation requirements

### Screen A — Landing page

Route: `/`

Layout:

1. Compact header with logo and one clear navigation path.
2. Hero section with outcome-focused headline, supporting paragraph, and primary CTA.
3. Three-step explanation of the product.
4. Preview of an evidence-backed assessment.
5. Privacy and trust statement.
6. Compact footer.

Recommended hero copy:

> Make your next application easier to get right.
>
> Understand the requirements, organize your documents, and find missing details before you submit.
>
> CTA: Check my application readiness

Behaviour:

- CTA navigates to `/applications/new`.
- No fake customer testimonials, fabricated success statistics, or unsupported institutional partnerships.
- The preview must be clearly illustrative if it does not contain real analysis.
- The page should work without requiring the user to understand AI terminology.

Acceptance tests:

- The primary CTA navigates to the correct route.
- The page renders without horizontal overflow at mobile, tablet, and desktop sizes.
- Headings, actions, and body text have a logical reading order.
- The privacy statement matches actual file-handling behaviour.

### Screen B — Create application

Route: `/applications/new`

Fields and controls:

- Application name.
- Opportunity type: scholarship or internship.
- Official opportunity notice upload — required.
- Supporting document upload — optional at this stage.
- File list with name, size, type, status, and removal action.
- Primary CTA: `Analyze requirements`.

Validation:

- Reject unsupported file types and oversized files on both client and server.
- Require a readable opportunity notice before starting analysis.
- Do not block the user for not supplying a transcript or CV.
- Warn on navigation away from unsaved work where applicable.
- Never trust MIME type or file extension alone to establish file safety.

Acceptance tests:

- Valid opportunity notice can be uploaded.
- Missing notice prevents analysis with an inline explanation.
- Unsupported and invalid files are rejected safely.
- Supporting files can be added and removed.
- A recoverable upload failure does not clear unrelated form values.

### Screen C — Processing

Route: `/applications/[applicationId]` with an explicit processing state, or a dedicated `/analysis` child route if the architecture requires it.

The screen should display real pipeline stages:

1. Document received.
2. Text extraction.
3. Requirement extraction.
4. Source-reference validation.
5. Assessment preparation.

The backend must persist analysis status so refreshing the page does not make a running job appear completed or restart it accidentally.

States:

- `queued`
- `extracting`
- `analyzing`
- `validating`
- `completed`
- `failed`
- `needs_user_input`

Acceptance tests:

- A completed stage appears only after its underlying operation succeeds.
- A failed operation displays a retry or replace-document action.
- Refreshing the page restores the correct status.
- Duplicate requests do not launch uncontrolled duplicate analyses.
- Unreadable or scanned PDFs produce an explicit supported recovery path rather than fabricated extracted text.

### Screen D — Assessment

Route: `/applications/[applicationId]/assessment`

Desktop layout:

- Page heading with application name and analysis status.
- Summary panel with assessment result and explanation.
- Requirement list in the main column.
- Source detail panel on the side, or a dialog on smaller screens.
- Priority actions near the top.
- Persistent action to continue to tasks.

Each requirement card must display:

1. Plain-language requirement.
2. Whether it is mandatory, optional, or unclear.
3. Evidence status.
4. Explanation of the match or mismatch.
5. Source document and location.
6. Recommended next action.

The eligibility result should use cautious labels such as:

- `Likely meets stated criteria`
- `Potential eligibility issue`
- `Insufficient information`

These labels must be derived from structured evidence, not a model's unsupported confidence alone.

Acceptance tests:

- Every critical requirement is traceable to its source or marked unsourced.
- Source excerpts match extracted source text.
- Missing evidence is distinct from evidence that failed verification.
- A potential disqualifier includes an explanation and source.
- The user can correct extracted information without losing unrelated findings.

### Screen E — Task workspace

Route: `/applications/[applicationId]/tasks`

Layout:

- Application title and overall progress.
- Priority task section.
- Full task list grouped by status or category.
- Task detail panel with source and evidence.
- Filters for all, outstanding, and completed tasks.

Each task contains:

- Title and description.
- Reason it matters.
- Linked requirement.
- Required evidence or action.
- Priority.
- Current status.
- User-confirmed completion state.

Acceptance tests:

- Progress derives from stored task states.
- Completing a task persists across refresh.
- Tasks can be reopened or corrected.
- A missing item can be resolved by attaching appropriate evidence or recording the action required.
- User completion does not falsely imply that the AI independently verified the evidence.

### Screen F — Final audit

Route: `/applications/[applicationId]/audit`

The audit should inspect all available requirements and application data before generating its findings.

Audit categories:

- Missing mandatory evidence.
- Unanswered required fields, when field data is available.
- Conflicting user information.
- Unverified or ambiguous requirements.
- Unsupported statements in prepared application content.
- Submission instructions or deadlines requiring confirmation.

Finding severity:

- `blocking`: a known mandatory requirement is unmet.
- `warning`: a potential issue or unresolved uncertainty.
- `info`: a recommendation or non-blocking improvement.

Use `blocking` only when the evidence supports that classification. An unknown deadline is not automatically a blocking issue; it should be clearly identified as unresolved.

Acceptance tests:

- The audit identifies all known critical missing requirements in the evaluation set or explicitly marks uncertainty.
- Findings link to the affected requirement or source.
- Users can return to the relevant task from a finding.
- The audit distinguishes document completeness from actual eligibility or likelihood of selection.
- The interface never claims that an external institution will accept the application.

## 7. Data model and application state

Define a canonical data model before wiring the screens together. Use shared TypeScript types and runtime schemas so the UI, API, AI pipeline, and database agree on the meaning of every status.

### Core entities

Application

ID, owner ID, name, opportunity type, status, created date, updated date.

Document

ID, application ID, storage key, original filename, detected file type, extraction status, page count, extracted text reference.

Requirement

ID, application ID, source document ID, requirement text, type, mandatory status, source location, evidence status, explanation, recommended action.

EvidenceMatch

ID, requirement ID, evidence document IDs, match status, supporting excerpt, verification status, unresolved conflicts.

Task

ID, application ID, linked requirement ID, title, description, priority, status, user-confirmed completion, timestamps.

AuditRun and AuditFinding

Audit version, timestamp, status, finding severity, description, linked requirement or source, recommended action, resolution state.

### State definitions

Use enumerations, not arbitrary UI strings.

```
type OpportunityType = "scholarship" | "internship";

type EvidenceStatus =
  | "matched"
  | "missing"
  | "needs_verification"
  | "conflict"
  | "not_applicable";

type TaskStatus =
  | "todo"
  | "in_progress"
  | "completed"
  | "blocked";

type AnalysisStatus =
  | "queued"
  | "extracting"
  | "analyzing"
  | "validating"
  | "completed"
  | "failed"
  | "needs_user_input";

type EligibilityStatus =
  | "likely_meets_stated_criteria"
  | "potential_issue"
  | "insufficient_information";

type FindingSeverity = "blocking" | "warning" | "info";
```

Store raw extraction output separately from user corrections and verified assessment data. This preserves provenance and lets the user see what the AI originally extracted versus what they subsequently corrected.

### Persistence requirements

- Every application and document must have a stable identifier.
- Relationships between applications, documents, requirements, and tasks must be enforced.
- Deleting an application must handle its dependent records and stored files consistently.
- Store timestamps in UTC and display them in the user's local timezone.
- Store file contents in private storage, not public URLs or database text columns unless the architecture specifically justifies it.
- Keep audit history sufficient to diagnose failures and explain results without retaining unnecessary sensitive document contents.

## 8. AI reliability architecture

This is the most important engineering section. The AI should not directly produce a final eligibility verdict from raw PDFs in one unconstrained prompt.

Use a staged pipeline:

1

Validate file

Type, size, safety checks

2

Extract text

Preserve page and section locations

3

Extract requirements

Structured output validated against a schema

4

Validate citations

Confirm excerpts and locations against extracted text

5

Match evidence

Compare each requirement with supplied documents

6

Assess uncertainty

Separate known facts, mismatches, and unknowns

7

Generate tasks and audit

Produce traceable actions from validated results

### Requirement extraction schema

Each extracted requirement should include a stable ID and enough information to support evidence matching and source navigation.

```
type SourceReference = {
  documentId: string;
  page?: number;
  section?: string;
  excerpt: string;
  startOffset?: number;
  endOffset?: number;
};

type ExtractedRequirement = {
  id: string;
  text: string;
  type:
    | "eligibility"
    | "document"
    | "deadline"
    | "submission"
    | "other";
  mandatory: boolean | "unknown";
  source: SourceReference | null;
  extractionStatus: "verified" | "uncertain";
};
```

Treat the schema above as a starting contract; the agent must add runtime validation, uniqueness checks, and any fields needed for deterministic processing.

### Citation validation

A model-generated page number or quotation is not proof that a citation is correct.

The pipeline must:

- Confirm that the referenced document belongs to the current application.
- Verify that the excerpt matches extracted text after explicitly defined normalization.
- Validate page numbers and section references against extraction metadata.
- Mark citations that cannot be verified as uncertain.
- Prevent fabricated references from being displayed as valid clickable citations.

Where PDF extraction can reliably preserve page boundaries, use them. If exact page-level references cannot be obtained, show the document and section or a verified excerpt instead of inventing a page number.

### Evidence matching

Evidence matching should combine deterministic rules with AI interpretation.

For example:

- A mandatory transcript is missing if no supplied document plausibly corresponds to it.
- A transcript exists but does not clearly establish the required GPA: `needs_verification`.
- Two documents contain different names or dates: `conflict`.
- A certificate appears to match a requirement but authenticity cannot be confirmed: `needs_verification`, not `matched_verified`.

Never use a language model's self-reported confidence as the sole basis for an eligibility decision.

### Audit generation

Generate audit findings from the validated requirement and evidence data, not from a fresh ungrounded summary of all documents.

Every finding must reference:

- The affected requirement or field.
- The relevant source, when one exists.
- The evidence or missing evidence that triggered the finding.
- The reasoning for its severity.
- A recommended next action.

The final audit must be repeatable: identical validated inputs and rules should not randomly change task completion states or silently erase existing findings.

## 9. API and service contracts

Keep the HTTP API thin. Route handlers should authenticate the request, validate inputs, authorize resource access, invoke application services, and return typed responses.

| Endpoint                       | Responsibility                                                      |
| ------------------------------ | ------------------------------------------------------------------- |
| `POST /api/applications`       | Create an application and return its ID.                            |
| `GET /api/applications/[id]`   | Fetch application metadata and current state.                       |
| `PATCH /api/applications/[id]` | Update permitted application metadata.                              |
| `POST /api/documents`          | Validate and upload a document linked to an authorized application. |
| `POST /api/analysis`           | Enqueue or initiate analysis for an application.                    |
| `GET /api/analysis/[id]`       | Retrieve analysis status and structured results.                    |
| `PATCH /api/tasks/[id]`        | Update task status after authorization and validation.              |
| `POST /api/audit`              | Create an audit run from current validated application data.        |
| `GET /api/audit/[id]`          | Retrieve the audit findings and resolution states.                  |

The exact routes may be adjusted to match the repository's conventions. The contracts and security guarantees must remain.

### Service boundaries

Create functions with responsibilities equivalent to:

```
createApplication(input)
validateAndStoreDocument(input)
extractDocumentText(documentId)
extractRequirements(applicationId)
validateSourceReferences(requirements)
matchEvidence(applicationId)
buildPersonalizedTasks(applicationId)
runReadinessAudit(applicationId)
updateTaskStatus(taskId, status)
```

Each service should have explicit input and output types. Handle expected errors with typed error results or well-defined exceptions. Never return raw provider errors or internal stack traces to the client.

### API safety requirements

- Authenticate and authorize every private resource operation.
- Validate request bodies using runtime schemas.
- Use rate limits and upload size limits.
- Make analysis creation idempotent or prevent duplicate in-flight runs.
- Apply request timeouts and bounded retries to external model calls.
- Avoid logging raw documents, secrets, or unnecessary personal information.
- Validate all AI-generated output before writing it to persistent storage.
- Treat document contents as untrusted data; defend against prompt injection and tool-use instructions embedded in files.
- Do not expose private storage keys or permanent public document URLs.

## 10. Testing strategy

Testing must cover visual behaviour and functional correctness, especially the boundary between what the AI claims and what the source actually supports.

### A. Unit tests

Test individual functions without calling an external model.

Required tests:

- File validation accepts supported types and rejects unsupported files.
- Requirement schema rejects invalid types and missing required fields.
- Citation validation rejects nonexistent documents and fabricated excerpts.
- Evidence matching distinguishes `missing`, `needs_verification`, and `conflict`.
- Task completion calculations use the correct source of truth.
- Audit severity rules classify known blocking issues separately from uncertainty.
- File and text normalization preserves meaningful content and source locations.
- User corrections do not silently mutate original extracted output.

### B. Integration tests

Test service boundaries with a test database, private test storage, and mocked AI provider responses.

Required tests:

- Upload and extraction produce a document record with the correct ownership.
- Analysis persists intermediate and terminal states.
- Malformed AI output is rejected and handled safely.
- An invalid citation cannot be stored as verified.
- Retrying a failed analysis does not create duplicate tasks or lose user corrections.
- Users cannot read or modify another user's application or documents.
- Failed storage or database operations return recoverable errors without reporting false success.
- Audit results are based on the latest validated application state.

### C. AI evaluation set

Create a small, human-reviewed collection of anonymized opportunity notices and supporting documents. Include at least these scenarios:

| Test scenario                                               | Expected behaviour                                           |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| Clear eligibility rules and all required documents          | Extract requirements and match evidence correctly.           |
| Missing transcript                                          | Flag the transcript as missing and create a relevant task.   |
| GPA below a stated threshold                                | Identify the potential disqualifier with a source reference. |
| Unclear deadline                                            | Mark the deadline uncertain and ask for verification.        |
| Contradictory dates across documents                        | Flag the conflict rather than choosing silently.             |
| Poorly formatted or unreadable PDF                          | Surface an extraction problem and request an alternative.    |
| A prompt injection embedded in a document                   | Treat it as untrusted document content, not an instruction.  |
| A model-generated fabricated citation                       | Reject the citation or mark it unverified.                   |
| A certificate whose authenticity cannot be checked          | Avoid claiming that the certificate is authentic.            |
| A requirement that does not apply to the user's opportunity | Avoid generating an irrelevant mandatory task.               |

Measure extraction quality at the requirement level, not just whether the model returned valid JSON.

Definitions:

- Precision: correct extracted requirements divided by all extracted requirements.
- Recall: correct extracted requirements divided by all ground-truth requirements.

The proposed 90% precision threshold for critical requirements must be measured on held-out examples, not just the same documents used during prompt development. Track recall as well; high precision achieved by omitting difficult requirements is not acceptable.

### D. End-to-end tests

Use Playwright to test the actual interface.

1. Open the landing page and click the primary CTA.
2. Create a scholarship application.
3. Upload a valid opportunity notice and supporting document.
4. Complete analysis using a deterministic mocked provider.
5. Verify extracted requirements and open a source citation.
6. Confirm that a missing item appears in the task checklist.
7. Mark a task complete and refresh the page.
8. Run the audit and verify the expected findings.
9. Simulate an analysis failure and recover without recreating the application.
10. Verify mobile navigation and essential actions at a 375 px viewport.

Use mocks for routine CI tests. Keep a separate optional smoke test for the actual AI provider, since live model outputs and external API availability are not deterministic.

## 11. Implementation phases and exit criteria

Build in this order. Each phase must pass its acceptance checks before the next phase expands the scope.

## 01

### Repository audit and foundation

Inspect the existing codebase, configure the framework, type checking, linting, environment variables, tokens, and shared layout components.

Exit criteria: application starts; typecheck, lint, and initial tests pass; no secrets are committed.

## 02

### Visual system and static screens

Build the landing page, create-application form, workspace shell, stepper, cards, badges, empty states, and responsive layouts using typed fixture data.

Exit criteria: consistent visual hierarchy, accessible components, responsive layouts, and no dead buttons.

## 03

### Document ingestion and persistence

Implement private file storage, server-side validation, PDF/DOCX text extraction, source-location metadata, and application persistence.

Exit criteria: valid documents can be uploaded and processed; invalid files fail safely; data survives refresh.

## 04

### Structured AI analysis

Implement schema-constrained requirement extraction, citation validation, evidence matching, uncertainty handling, and persisted processing states.

Exit criteria: AI outputs are validated, critical requirements are evaluated against reference answers, and fabricated citations cannot appear verified.

## 05

### Assessment, tasks and final audit

Connect the assessment UI to validated results, generate actionable tasks, persist user corrections, and build the readiness audit.

Exit criteria: the complete happy path works with real data, and missing items lead to actionable findings.

## 06

### Reliability, security and demo polish

Run the evaluation set, test authorization boundaries, verify error recovery, refine responsive behaviour, and prepare one reproducible demo scenario.

Exit criteria: no unresolved critical workflow failures, the test suite passes, and demo data produces repeatable results.

### Build priorities if time becomes tight

Prioritize in this order:

1. One complete application workflow.
2. Source-linked requirement extraction.
3. Accurate missing-evidence detection.
4. Actionable checklist and final audit.
5. Reliable error handling and persistence.
6. Visual polish.
7. Optional enhancements only if all previous priorities are stable.

Do not sacrifice source validation, security, or the working core journey to add more screens.

## 12. Demo data and repeatability

The hackathon demo must not depend on finding a suitable document, a live model response, or a stable internet connection at the last moment.

Prepare a fictional or appropriately anonymized scholarship scenario containing:

- A clearly stated eligibility threshold.
- A deadline.
- Three or more mandatory supporting documents.
- A sample student profile.
- One missing required document.
- One detail that requires verification.

Create a human-reviewed expected result for the scenario. The app should use the real pipeline during normal operation, with a controlled fixture mode available for deterministic demonstrations and automated tests.

Fixture mode must be clearly separated from production mode. Never present prewritten results as fresh AI analysis.

## 13. Definition of done for the MVP

ClearPath is ready to demonstrate when all of the following are true:

- A student can create an application and upload supported files.
- The opportunity notice is processed into structured requirements.
- Critical requirements have verified source references or explicit uncertainty markers.
- The system distinguishes missing evidence from evidence needing verification.
- The assessment explains eligibility concerns without promising acceptance.
- The student receives a personalized checklist.
- Task updates persist across refresh.
- The final audit links findings to affected requirements and recommended actions.
- Upload failures and AI errors have recoverable states.
- The core flow works at mobile and desktop widths.
- Access controls protect private application data.
- Unit, integration, AI evaluation, and end-to-end tests have been run, with results recorded.
- The README documents setup, environment variables, testing, known limitations, and demo instructions.

## 14. Instructions to the coding agent

Give the agent the following execution instructions alongside this specification.

# Execution Rules for ClearPath

Treat the ClearPath implementation plan as the product contract.

1. Inspect the existing repository before modifying it. Report the current stack, implemented features, gaps, and any conflicts with the specification.
2. Produce a short implementation plan for the next phase, then implement that phase. Do not attempt to generate the entire application in one pass.
3. Reuse existing infrastructure and working components where appropriate. Explain significant architecture changes before making them.
4. Establish design tokens and reusable components before building all screens. Do not improvise a new visual style for each page.
5. Use strict TypeScript, shared runtime schemas, and explicit application states. Avoid `any`, unsafe casts, duplicated business logic, and hardcoded progress.
6. Keep AI calls and private file operations on the server. Validate model outputs and verify citations against extracted source material.
7. Do not mark a requirement verified merely because the model claims confidence. Represent missing information, conflicting evidence, and uncertainty explicitly.
8. Do not fabricate completed features, successful operations, source references, user data, or test results.
9. Add automated tests alongside the functionality they verify. Run relevant tests after each phase and report failures honestly.
10. Preserve the defined MVP scope. Do not add contract analysis, job discovery, automated submissions, or other deferred features without explicit approval.
11. Before declaring a phase complete, report what changed, what was tested, the results, and any remaining limitations.
12. Keep the application runnable throughout development. Prefer small, reviewable changes over large rewrites.

## First task

Do not begin by implementing all screens.

Inspect the repository, compare its current state against this specification, and return:

- Existing stack and project structure.
- What is already implemented.
- Missing or incomplete requirements.
- Any security or architecture risks.
- A prioritized implementation sequence.
- The exact files you intend to create or modify in the first phase.

Then implement Phase 1 and verify it before proceeding.

The goal is a coherent, working product—not merely a large amount of generated code.
