# ClearPath

ClearPath is a student application-preparation workspace for scholarship and internship opportunities. It organizes opportunity details, requirement notes, follow-up tasks, and a final readiness checklist in one place.

## What is implemented

- Responsive public landing page and guided demo.
- Clerk sign-in and sign-up, with application routes and APIs protected by authentication.
- User-owned Neon Postgres workspace persistence. Every read, update, and delete is scoped to the authenticated Clerk user.
- Private Vercel Blob document storage with server-side content-signature checks, bounded PDF/DOCX extraction, per-workspace limits, user-scoped download/delete endpoints, and stored extracted text.
- Explicit-consent AI-assisted requirement extraction and evidence comparison through Vercel AI Gateway. Exact source/evidence excerpts are checked against extracted text; output remains preliminary and user-verifiable.
- Per-user daily limits on uploads and AI analysis, with separate workspace/document deletion.
- Workspace creation for a scholarship or internship, with opportunity name, organization, deadline, requirement text, and optional supporting-document names.
- Requirement assessment with source excerpts, cautious statuses, filters, and user-editable status.
- Persistent checklist with task states and progress derived from saved tasks.
- Deterministic readiness audit, persisted with the workspace and marked out of date when underlying information changes.
- Fictional Northstar Foundation scholarship demo with known missing and uncertain evidence.
- Unit tests for eligibility derivation, source excerpts, audit findings, and task progress.

## Important current limitations

The authenticated workspace and document-processing path are implemented, but ClearPath still needs operational safeguards before broad production use:

- Only the fictional guided demo is saved in browser `localStorage`. Real workspaces are stored in Neon Postgres under the signed-in Clerk user.
- Scanned/image-only PDFs and OCR are not supported. Uploaded documents are limited to 10 MB each, 25 files and 50 MB total per workspace, and 20 uploads per user per day.
- AI review is optional, requires explicit consent, and is limited to 10 analyses per user per day. The selected source and evidence text is transmitted to OpenAI through Vercel AI Gateway for that analysis. Review results are suggestions, not verification or eligibility decisions.
- There is no antivirus/malware scanning or automatic document-retention period. Users can delete documents and workspaces; do not upload documents you are not authorized to process.
- AI Gateway credentials must be available in the deployment (Vercel OIDC or `AI_GATEWAY_API_KEY`). Without them, manual requirement tracking and document storage still work, while AI analysis reports that it is unavailable.
- The demo's sample statuses and audit are fictional, fixed demonstration data. Starting the demo does not analyze a real application.
- OCR, automatic retention, self-service account deletion/export, malware scanning, production observability/alerting, and comprehensive integration/end-to-end coverage are not implemented. Uploaded files are stored privately and extracted text is retained with the workspace until deleted; consented AI review sends selected text to OpenAI through Vercel AI Gateway.

Authentication, user-scoped database ownership, private document storage, upload/analysis limits, and optional AI suggestions are in place. The remaining operational safeguards and independent privacy/security review are required before handling highly sensitive student records at scale.

## Requirements

- **Framework:** Next.js 16 App Router
- **Language/UI:** TypeScript, React 18, plain CSS with centralized CSS variables, Lucide icons
- Node.js 22 or newer (required by the configured AI SDK dependencies and recommended for the Neon serverless driver)
- npm

## Setup and run

```bash
npm install
npm run db:migrate
npm run dev
```

Configure Clerk, Neon, and Vercel Blob environment variables in `.env.local` before running. The integrations provision their credentials through Vercel Marketplace; configure AI Gateway credentials for AI analysis. Copy `.env.example` as a reference; never commit `.env.local`.

Open <http://localhost:3000>, sign in, and create a workspace to save it to your account. Upload documents from the workspace assessment, choose each document's purpose, then explicitly consent before running AI analysis. **Try the guided demo** opens the fictional sample and stores only that demo locally. The `db:migrate` command applies all SQL migrations in order. No secret or AI key should be added to client-side code.

## Checks

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## Production work still required

Before broad production launch, complete independent integration/e2e testing against isolated test services, add malware scanning and a documented retention/account-deletion policy, configure production observability/alerting, and perform an operational privacy/security review. OCR and self-service account export/deletion are not implemented. Users can currently delete individual documents and workspaces, but there is no automated retention or account-wide deletion workflow.

ClearPath is a preparation aid. It cannot guarantee eligibility, a scholarship award, an internship offer, or acceptance.
