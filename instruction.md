# MASTER BUILD INSTRUCTION — CLEARPATH

## 1. Your role and mission

Act as a senior full-stack engineer, product designer, AI engineer, security engineer, and QA engineer.

Your task is to **build ClearPath, a complete, reliable, responsive, AI-assisted application-readiness platform for students**. This is a real implementation task, not a request for a design concept, static mockup, or technical proposal.

Build a polished, working product that a student can use from the first screen through the final application-readiness audit.

Work directly in the existing repository. Inspect the project before making changes, preserve working functionality, and implement the system incrementally. Make sensible engineering decisions independently instead of asking for approval for every detail.

### Product objective

Students applying for scholarships and internships often struggle to interpret opportunity requirements, identify the right supporting documents, determine what is missing, and check their applications before submission.

ClearPath helps students:

1. Understand the requirements of a scholarship or internship.
2. Upload relevant documents and supporting evidence.
3. Compare their evidence against the stated requirements.
4. Understand which requirements appear satisfied, which are missing, and which need verification.
5. Receive a personalized checklist of actions.
6. Complete those actions and track their progress.
7. Run a final readiness audit before submitting their application.

**Core product promise:** Help students understand what is required, organize their evidence, and catch missing or uncertain information before they submit.

ClearPath must never guarantee eligibility, scholarship awards, internship offers, or application acceptance.

## 2. Rules you must follow

- Inspect the existing repository before choosing or changing the technology stack.
- Reuse existing architecture, dependencies, database, authentication, and UI components where reasonable.
- Do not replace a working application with a new scaffold just because you prefer another stack.
- If the repository is empty, initialize a suitable modern web application.
- Build real interactions, persistence, validation, and error handling—not buttons that merely look functional.
- Implement one complete, working end-to-end journey before adding optional features.
- Use strict typing and shared validation schemas.
- Keep secrets, AI calls, privileged operations, and sensitive document processing on the server.
- Treat uploaded documents and their contents as untrusted input.
- Never fabricate requirements, source quotations, citations, eligibility results, or document-processing outcomes.
- Do not report a feature as complete unless it has actually been implemented and tested.
- Do not use fake progress bars or pretend that a long-running AI operation has completed.
- Do not add features outside the agreed scope without a strong reason.
- Do not leave placeholder pages, broken links, empty actions, or TODO-only implementations in the core journey.
- Run the relevant tests and checks after meaningful changes.
- Keep the application runnable throughout development.
- If a required external service is not configured, implement a clearly defined integration boundary and an honest, usable development/demo fallback. Document what still needs configuration.

## 3. Phase zero: inspect the repository

Before changing files, inspect the project and report:

- Existing framework, language, package manager, and directory structure.
- Existing pages, reusable components, and design system.
- Authentication and authorization mechanisms.
- Database and persistence approach.
- Existing file-storage and document-processing capabilities.
- Existing AI integrations and environment variables, without exposing secret values.
- Current tests, linting, type-checking, and build commands.
- What already works, what is incomplete, and what conflicts with this specification.

Then create a short implementation plan based on the actual repository.

Proceed with implementation immediately after the audit. Do not stop after producing the plan.

## 4. Recommended technical architecture

Use these defaults only when the existing repository does not already provide a suitable alternative.

- **Framework:** Next.js with App Router.
- **Language:** TypeScript in strict mode.
- **Styling:** Tailwind CSS with centralized design tokens.
- **UI:** Accessible, reusable primitives; shadcn/ui may be used where appropriate.
- **Forms:** React Hook Form and Zod.
- **Persistence:** PostgreSQL with Prisma, or the repository's existing database.
- **Documents:** Server-side PDF and DOCX text extraction.
- **AI:** A server-side provider adapter with schema-validated structured outputs.
- **File storage:** Private object storage or an appropriate private development storage implementation.
- **Unit and integration testing:** Vitest and React Testing Library, or existing equivalents.
- **End-to-end testing:** Playwright, or the repository's existing equivalent.

Keep the architecture modular without overengineering it. Separate UI, business logic, persistence, document extraction, AI orchestration, and security-sensitive operations.

Suggested structure, adapted to the repository rather than imposed blindly:

```text
app/
  page.tsx
  applications/
    new/
    [id]/
      page.tsx
      assessment/
      tasks/
      audit/
  api/
    applications/
    documents/
    analysis/
    tasks/
    audit/

components/
  ui/
  layout/
  documents/
  requirements/
  assessment/
  tasks/
  audit/

features/
  applications/
    components/
    hooks/
    schemas/
    services/
    types/
    utils/

lib/
  ai/
    provider.ts
    prompts.ts
    schemas.ts
    extraction.ts
    matching.ts
    citations.ts
    auditing.ts
  documents/
    validation.ts
    pdf.ts
    docx.ts
    text-normalization.ts
  db/
  storage/
  security/

prisma/
tests/
  unit/
  integration/
  evaluation/
  e2e/
```

Do not create every suggested file merely to match this tree. Create modules when they serve a real responsibility.

## 5. Design direction and visual identity

The interface must feel like a trustworthy student productivity product: modern and professional, but approachable and easy to understand.

Avoid the appearance of a generic AI chatbot, a corporate admin dashboard, or a collection of unrelated cards.

### Design tokens

Start with the following palette and centralize it in the project's theme system:

- Primary forest green: `#173F35`
- Subtle green: `#E8F1EC`
- Page background: `#F7F8F5`
- Surface: `#FFFFFF`
- Primary text: `#252B28`
- Muted text: `#6B746F`
- Borders: `#E1E5E0`

Define semantic tokens for success, warning, danger, and information. Never rely on color alone to communicate a state; pair colors with readable labels and, where appropriate, icons.

### Typography and spacing

- Use Inter or a comparable clean sans-serif.
- Hero heading: approximately 44px on desktop.
- Page heading: approximately 32px.
- Section heading: approximately 24px.
- Card heading: approximately 17–18px.
- Body text: approximately 15–16px.
- Helper text: approximately 13–14px.
- Use a consistent spacing scale based on 4, 8, 12, 16, 24, 32, 48, and 64px.
- Use restrained corner radii, generally 8, 12, and 16px.
- Maintain clear visual hierarchy, comfortable whitespace, readable line lengths, and strong contrast.

### Interaction principles

- The next action should always be obvious.
- Explain technical concepts in plain language.
- Distinguish a completed check from an unresolved question.
- Show loading, empty, success, partial-success, and error states.
- Preserve user progress when navigation or processing fails.
- Use responsive layouts for mobile, tablet, and desktop.
- Support keyboard navigation, visible focus, accessible labels, and reduced-motion preferences.
- Avoid excessive animations, gradients, decorative charts, and unnecessary visual complexity.

### Shared components

Build or reuse components appropriate to the existing codebase:

- MarketingHeader and WorkspaceHeader
- AppShell and PageContainer
- PageHeader and ContentPanel
- WorkflowStepper and MobileStepNavigation
- Button, StatusBadge, and form primitives
- FileDropzone and UploadedFileRow
- RequirementCard and SourceCitation
- EligibilitySummary and EvidenceStatus
- TaskItem and ProgressSummary
- AuditFinding
- EmptyState, LoadingState, and ErrorState
- ConfirmationDialog and toast notifications
- StickyActionBar where useful

Components must be reusable and consistent, not merely duplicated markup.

## 6. Implement the complete student journey

### Screen A: Landing page

Build a polished public landing page explaining ClearPath's value immediately.

Include:

- A clear headline explaining that students can check application requirements and prepare their evidence.
- A concise supporting description.
- A prominent primary action such as “Check my application”.
- A secondary action explaining how the platform works.
- A simple visual explanation of the workflow.
- Feature sections for requirement understanding, evidence matching, personalized tasks, and readiness audits.
- A realistic product preview or UI composition built from actual application components.
- A clear privacy statement and a disclaimer that the tool supports preparation rather than guaranteeing outcomes.
- A responsive footer.

The main CTA must navigate to a functioning application-creation flow.

### Screen B: Create an application

Allow the student to create an application workspace with:

- Opportunity name.
- Opportunity type: scholarship or internship.
- Institution or organization, if known.
- Application deadline, if provided.
- Official opportunity notice or requirements document.
- Optional supporting documents.
- Optional notes or student-provided context.

Accept appropriate supported document types, including PDF and DOCX, and text files if implemented safely. Define and enforce file-size limits.

Provide clear upload instructions, progress indicators, file names, file sizes, removal or replacement actions, and useful validation errors.

The user must be able to proceed without optional supporting documents.

Do not assume information that the user has not supplied. Missing metadata should remain unknown rather than being invented.

### Screen C: Document processing

Implement real processing states, persisted where appropriate:

- `queued`
- `extracting`
- `analyzing`
- `validating`
- `completed`
- `needs_user_input`
- `failed`

Display understandable progress and what is happening.

A failed extraction or AI call must not destroy the workspace. Explain the problem and offer an appropriate retry, replacement, or manual-input path.

Do not represent a timer or arbitrary percentage as actual processing progress. If progress is indeterminate, communicate that honestly.

For a document that cannot be parsed, allow the student to provide the relevant requirements manually, with clear labeling that the information was user-supplied.

### Screen D: Requirement assessment

This is the core of ClearPath. Make it clear, actionable, and trustworthy.

For each identified requirement, show:

- The requirement in plain language.
- Its category, where useful.
- Whether it is mandatory, preferred, conditional, or unclear, based on the source.
- A source citation pointing to the original document.
- The student's evidence, if any.
- The assessment status.
- Why that status was assigned.
- The next action, if any.

Support the following evidence statuses:

- `matched`: available evidence supports the requirement.
- `missing`: the necessary evidence or item has not been provided or identified.
- `needs_verification`: evidence exists but cannot yet establish the requirement.
- `conflict`: the available information contains an unresolved contradiction.
- `not_applicable`: the requirement does not apply, with a recorded reason.

Never treat “not uploaded” as proof that a student is ineligible. It means the evidence is currently unavailable.

Include an overall eligibility assessment with these states:

- `likely_meets_stated_criteria`
- `potential_issue`
- `insufficient_information`

These labels are preliminary assessments against the supplied criteria, not official decisions.

Explain the basis of each assessment. Make unresolved questions visible rather than forcing every requirement into a definitive status.

Provide filters or groupings that help students focus on missing items, items needing verification, and satisfied requirements.

### Screen E: Personalized task workspace

Convert unresolved requirements and missing preparation steps into a personalized checklist.

Each task should have:

- A clear action-oriented title.
- A plain-language explanation.
- Its associated requirement.
- Priority and deadline, where supported by available information.
- A task status.
- A suggested next step.
- Relevant source references.

Support task states:

- `todo`
- `in_progress`
- `completed`
- `blocked`

Allow users to update tasks and persist changes.

Show a meaningful summary of completed, remaining, and blocked tasks. Calculate progress from real persisted task states, not a hardcoded percentage.

Examples of possible tasks include obtaining a transcript, verifying a GPA requirement, requesting a recommendation letter, or confirming a deadline. Generate these only when justified by the student's application and evidence.

Never create unnecessary tasks merely to make the product appear more comprehensive.

### Screen F: Final readiness audit

Build a final audit that evaluates the current application using its saved, validated requirements, evidence matches, and task states.

Group findings into:

- **Blocking:** a confirmed unmet mandatory requirement or missing mandatory application item, when supported by the available evidence.
- **Warning:** an unresolved issue, uncertain evidence, contradiction, or important item that needs attention.
- **Information:** useful reminders or non-blocking observations.

Each finding must explain:

- What was found.
- Why it matters.
- Which requirement or source supports it.
- What the student should do next.

Distinguish between an incomplete application, an uncertain application, and one for which all checked requirements appear satisfied.

Use cautious outcomes such as “Ready based on the checks completed” rather than “Guaranteed eligible” or “Guaranteed acceptance.”

Run the audit from the latest saved data. If the student changes documents, requirements, or tasks, indicate when the audit is outdated and allow it to be rerun.

Persist audit results and their findings.

## 7. Data model and persistence

Use the existing data layer when practical. Otherwise, implement an appropriately normalized schema around these entities.

### Application

Include an ID, owner or user association when authentication exists, title, opportunity type, institution, deadline, notes, processing status, timestamps, and relevant analysis version.

### Document

Include an ID, application ID, original file name, verified MIME type, file size, storage reference, extraction status, extracted text or a suitable protected reference, and timestamps.

Keep files private. Do not expose raw storage paths or sensitive file contents in public responses.

### Requirement

Include an ID, application ID, description, category, requirement type, source document reference, source location or quotation, validation status, and timestamps.

### EvidenceMatch

Include an ID, requirement ID, relevant document or evidence reference, evidence status, explanation, validated source references, and timestamps.

### Task

Include an ID, application ID, optional requirement ID, title, description, priority, status, due date when justified, and timestamps.

### AuditRun and AuditFinding

Record each audit run, the data/version evaluated, its overall result, findings, severity, supporting requirement references, suggested actions, and creation time.

Use suitable database enums and foreign-key constraints where supported.

Important implementation rules:

- Persist user-visible state.
- Enforce ownership and authorization on every relevant read and write.
- Do not trust client-supplied application IDs or ownership claims.
- Keep task completion, analysis results, and audit history consistent.
- Handle retries and duplicate requests safely.
- Avoid storing duplicate extracted text or redundant data without a reason.
- Define retention and deletion behavior appropriate for sensitive student documents.

## 8. Build a safe, structured AI pipeline

AI is a key capability, but it must not be the authority on whether its own results are valid.

Create a provider-independent server-side AI interface. Use the existing provider if the repository already has a working integration. Otherwise, select an available structured-output-capable provider through configuration and document the required environment variables.

Never place API keys in client-side code.

### Step 1: Validate uploaded files

Validate actual file content where feasible, file type, size, and processing limits. Reject unsupported or suspicious files. Do not trust file extensions alone.

Use safe storage names and private storage. Prevent path traversal and unauthorized file access.

### Step 2: Extract document text

Extract text from supported PDF and DOCX formats on the server.

Preserve source-location metadata wherever possible, such as page number, section heading, paragraph, or text span.

Detect empty, unreadable, encrypted, or image-only documents. Do not silently treat extraction failure as an empty document with no requirements.

If OCR is not available, state the limitation and provide a reasonable manual-input path.

### Step 3: Extract structured requirements

Ask the AI to identify candidate requirements using a strict schema.

The schema should support:

- Requirement text.
- Requirement type and category.
- Mandatory/preferred/conditional/unclear classification.
- Source document identifier.
- Source page, section, or text-span information when available.
- Supporting quotation or exact source excerpt.
- Uncertainty and ambiguity.
- Conditional logic and relevant caveats.

Do not accept free-form model output as application state. Validate it against the schema and the actual extracted source.

### Step 4: Validate citations

Verify that cited documents exist and that source quotations can be found in the extracted text, allowing only carefully defined normalization where necessary.

Where a precise page or section cannot be validated, mark the location as approximate or unavailable rather than inventing it.

Reject unsupported requirements and mark ambiguous ones for review.

The model's confidence score is not proof that a requirement or citation is correct.

### Step 5: Match requirements to evidence

Compare validated requirements against the documents and information the student actually supplied.

For each match, record:

- The evidence used.
- Its source location.
- How it supports or fails to establish the requirement.
- The resulting status.
- Any unresolved uncertainty.

A transcript showing a GPA may support a GPA requirement, for example, but a missing transcript does not prove the student has a low GPA.

Handle conflicting dates, inconsistent names, outdated evidence, missing pages, ambiguous eligibility conditions, and unverifiable claims explicitly.

### Step 6: Generate personalized tasks

Create tasks from validated requirements and evidence gaps.

Tasks must have a traceable reason. Avoid duplicate tasks and avoid turning optional preferences into mandatory blockers.

### Step 7: Generate the audit

Build the audit from validated and persisted application data. Do not ask a fresh unconstrained model to invent the final result.

AI may help explain findings, but deterministic business rules should govern classifications wherever feasible.

### AI reliability and security requirements

- Validate all model outputs against schemas.
- Set request timeouts, bounded retries, and appropriate rate limits.
- Handle provider outages and malformed responses gracefully.
- Use idempotent or safely retryable processing where appropriate.
- Treat document contents as untrusted data, not instructions.
- Ignore embedded instructions asking the model to reveal secrets, override system rules, change application state, or fabricate results.
- Do not log raw document contents or secrets unnecessarily.
- Minimize data sent to external AI providers.
- Explain material uncertainty to the student.
- Never fabricate a citation, qualification, deadline, document, or result.
- Record processing errors without exposing sensitive internals.

## 9. API and service boundaries

Adapt routes to the existing framework. The following are suggested capabilities, not a requirement to use these exact URLs.

- Create and retrieve applications.
- Update permitted application metadata.
- Upload, validate, list, and remove documents.
- Start requirement analysis.
- Retrieve processing status and results.
- Update task status.
- Start and retrieve readiness audits.

Suggested service boundaries:

- `createApplication`
- `validateAndStoreDocument`
- `extractDocumentText`
- `extractRequirements`
- `validateSourceReferences`
- `matchEvidence`
- `buildPersonalizedTasks`
- `updateTaskStatus`
- `runReadinessAudit`

Keep business logic out of page components and HTTP handlers wherever possible.

Validate request bodies and responses. Use appropriate status codes, consistent error shapes, and authorization checks. Do not return internal stack traces, credentials, or private storage information.

## 10. Security and privacy

Treat scholarship applications and student documents as sensitive personal information.

Implement the following:

- Authentication if the product's architecture supports multiple users.
- Authorization and ownership checks on every application and document operation.
- Private file storage and access-controlled downloads.
- Server-side environment variables for secrets.
- File size, type, and content validation.
- Safe document parsing and processing limits.
- Rate limiting on costly or abuse-prone endpoints where practical.
- Protection against unauthorized cross-user access.
- Safe handling of model-generated and user-generated content.
- Appropriate deletion and retention behavior.
- Clear error messages that do not leak sensitive information.

If authentication is not yet implemented, do not pretend that a public, shared workspace is private. Make the development/demo mode explicit, restrict access where feasible, and document the limitation before deployment.

## 11. Testing requirements

Write tests while building the product, not only at the end.

### Unit tests

Test:

- File validation.
- Text normalization.
- Requirement schema validation.
- Citation verification.
- Evidence matching.
- Task generation.
- Task progress calculations.
- Audit severity and outcome rules.
- Eligibility-state derivation.
- Authorization and access-control helpers.

### Integration tests

Mock the AI provider and test:

- Successful document analysis.
- Invalid structured model output.
- Fabricated or unresolvable citations.
- Provider timeouts and failures.
- Extraction failure.
- Duplicate requests and retry behavior.
- Persistence of analysis and tasks.
- Audit generation from saved application data.
- Unauthorized access attempts.

### AI evaluation set

Create a small, human-reviewed set of representative documents and expected outcomes, including:

1. Clear eligibility requirements.
2. Missing transcript.
3. GPA below an explicitly stated threshold.
4. Ambiguous or missing deadline.
5. Contradictory dates across documents.
6. Unreadable or empty PDF.
7. Prompt injection embedded in a document.
8. Fabricated citation returned by a mocked model.
9. Certificate whose validity cannot be verified.
10. Irrelevant content that should not become a requirement.

Measure both precision and recall for requirement extraction. Aim for at least 90% precision on critical requirement extraction in the held-out evaluation set, while reporting the sample size and measuring recall as well. Do not claim to have met the target unless the tests support it.

Use deterministic mocked results for tests. Never make the test suite depend on live AI output.

### End-to-end tests

Test the complete journey:

1. Open the landing page.
2. Create an application.
3. Upload an opportunity notice.
4. Upload optional student evidence.
5. Run analysis.
6. Review source-linked requirements.
7. Identify a missing or uncertain item.
8. Complete or update a checklist task.
9. Run the readiness audit.
10. Verify that results persist after navigation or reload.

Also test mobile layouts, empty states, and recoverable errors.

## 12. Demo mode and realistic sample data

Provide a reliable demo experience so the product can be evaluated even when external AI credentials are unavailable.

Use a fictional or anonymized scholarship opportunity with:

- Explicit eligibility criteria.
- A stated deadline.
- At least three mandatory application documents.
- A sample student profile.
- One genuinely missing item.
- One uncertain detail.
- Expected, manually verified requirement and audit results.

The sample data must be internally consistent and suitable for demonstrating the complete workflow.

If you implement a fixture-based demo, make it deterministic and clearly distinguish demo results from live AI analysis. Do not silently substitute fixtures for production processing.

Provide an obvious way to start the demo without requiring the evaluator to upload private documents.

## 13. Suggested implementation phases

### Phase 1 — Foundation

- Inspect the repository.
- Confirm architecture and dependencies.
- Establish or improve design tokens and shared UI components.
- Implement the main page and application workspace structure.
- Configure validation, error handling, and test commands.

### Phase 2 — Core user interface

- Implement the landing page.
- Implement application creation and document upload UI.
- Implement the assessment, task, and audit screens.
- Ensure the journey works with deterministic sample data.

### Phase 3 — Persistence and documents

- Implement the required data models and migrations.
- Implement safe upload and document storage.
- Implement PDF/DOCX extraction and processing states.
- Persist application and task data.

### Phase 4 — AI analysis

- Implement the provider adapter.
- Implement structured requirement extraction.
- Validate citations against extracted source text.
- Implement evidence matching and uncertainty handling.
- Add mocked provider tests and the evaluation dataset.

### Phase 5 — Assessment and audit

- Generate personalized tasks from validated findings.
- Implement persisted task updates.
- Implement the final audit from saved data.
- Ensure outdated audits are identified and can be rerun.

### Phase 6 — Hardening and delivery

- Complete authorization and security checks.
- Fix responsive layout and accessibility issues.
- Add end-to-end tests.
- Verify the production build.
- Configure demo data and setup documentation.
- Prepare the application for deployment using the repository's available infrastructure.

**Priority rule:** If time becomes limited, deliver one complete, reliable, polished student journey before expanding functionality. Never sacrifice basic correctness, source validation, or working persistence to add superficial features.

## 14. Required delivery documentation

Update the README with:

- Product overview.
- Technology stack.
- Prerequisites.
- Installation and setup instructions.
- Required environment variables, with example placeholder values only.
- Database migration and seeding instructions.
- Development and production commands.
- Test, lint, type-check, and build commands.
- How to run the demo.
- How to configure the AI provider.
- Supported file types and limitations.
- Privacy and security considerations.
- Known limitations and future improvements.

Never put real API keys or credentials in the README.

## 15. Definition of done

The core implementation is complete only when all applicable items below have been verified:

- [ ] The landing page is polished and responsive.
- [ ] A student can create an application workspace.
- [ ] Supported documents can be uploaded and validated.
- [ ] Document processing produces honest, recoverable states.
- [ ] Requirements are extracted into validated structured data.
- [ ] Critical findings link back to their sources, or are explicitly marked uncertain.
- [ ] Missing evidence is distinguished from verified ineligibility.
- [ ] Eligibility assessments are cautious and explain their basis.
- [ ] Personalized tasks are generated and persisted.
- [ ] Task progress reflects real saved state.
- [ ] The readiness audit uses the latest validated application data.
- [ ] Audit findings include reasons and actionable next steps.
- [ ] The demo works without depending on live AI credentials.
- [ ] Core flows have automated tests.
- [ ] The application builds successfully.
- [ ] Relevant lint and type checks pass.
- [ ] The README explains setup, testing, demo mode, and limitations.
- [ ] No core action is a dead button or a fake success state.
- [ ] Security and privacy limitations are clearly documented.

Do not mark unchecked items as complete.

## 16. Final operating instructions

Begin by auditing the repository, then proceed with implementation.

After each phase:

1. Summarize what was implemented.
2. List the important files and architectural decisions.
3. Run the relevant tests and checks.
4. Report failures honestly.
5. Fix important regressions before moving forward.
6. Identify any genuine blockers that require credentials, infrastructure, or a user decision.

At the end, provide:

- A concise summary of implemented functionality.
- The key architecture and design decisions.
- Setup and run instructions.
- Required environment variables.
- Database migration and demo instructions.
- Tests run and their actual results.
- Build and type-check status.
- Security limitations.
- Remaining bugs, missing features, and deployment requirements.
- The fastest way for an evaluator to experience the complete demo.

**Start now. Inspect the repository first. Then build ClearPath end to end, prioritizing correctness, usability, trustworthiness, and a reliable demonstration over unnecessary complexity.**
