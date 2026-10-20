"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Info,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import {
  ClearpathApplication,
  extractManualRequirements,
  OpportunityType,
} from "@/lib/domain";
import { createApplication } from "@/lib/client/applications";
import { makeId } from "@/lib/storage";

export default function NewApplicationForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<OpportunityType>("scholarship");
  const [organization, setOrganization] = useState("");
  const [deadline, setDeadline] = useState("");
  const [studentContext, setStudentContext] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (name.trim().length < 3) {
      setError("Add an application name with at least 3 characters.");
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();
    const id = makeId();
    const requirements = extractManualRequirements(sourceText);
    const application: ClearpathApplication = {
      id,
      name: name.trim(),
      type,
      organization: organization.trim(),
      deadline,
      studentContext: studentContext.trim(),
      sourceText: sourceText.trim(),
      sourceName: sourceText.trim() ? "Requirements pasted by you" : "",
      supportingFiles: [],
      requirements,
      tasks: requirements
        .filter((requirement) => requirement.kind === "mandatory")
        .map((requirement, index) => ({
          id: `task-${index + 1}`,
          requirementId: requirement.id,
          title: requirement.action,
          description: `Review the source and confirm the evidence needed for: ${requirement.text}`,
          status: "todo" as const,
          priority: index < 2 ? ("high" as const) : ("medium" as const),
        })),
      audits: [],
      createdAt: now,
      updatedAt: now,
      isDemo: false,
    };
    try {
      await createApplication(application);
      router.push(`/applications/${id}/assessment`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "The workspace could not be saved. Please try again.");
      setSaving(false);
    }
  }

  return (
    <main className="create-page">
      <header className="create-header">
        <Link href="/" className="wordmark"><span className="brand-mark"><span /></span><span>clearpath</span></Link>
        <span className="create-header-note"><LockKeyhole size={14} /> Saved securely to your account</span>
      </header>
      <div className="create-layout">
        <div className="create-intro">
          <Link className="back-link" href="/"><ArrowLeft size={15} /> Back to home</Link>
          <div className="eyebrow"><span className="eyebrow-dot" /> START WITH THE OPPORTUNITY</div>
          <h1>Let’s make this<br /><em>feel manageable.</em></h1>
          <p>Set up a workspace for one opportunity. You can add evidence and resolve open questions as you go.</p>
          <div className="create-steps">
            <div className="create-step active"><span>1</span><div><b>Opportunity</b><small>Tell us what you’re applying for</small></div></div>
            <div className="create-step"><span>2</span><div><b>Requirements</b><small>Review the details you provide</small></div></div>
            <div className="create-step"><span>3</span><div><b>Readiness check</b><small>Make a plan for next steps</small></div></div>
          </div>
          <div className="create-privacy"><ShieldCheck size={17} /><span>Your workspace belongs to your account. You can privately upload the opportunity notice and supporting evidence after creating it.</span></div>
        </div>

        <form className="application-form" onSubmit={handleSubmit}>
          <div className="form-heading"><div><div className="form-step-label">YOUR NEW WORKSPACE</div><h2>Tell us about the opportunity</h2></div><span className="step-counter">01 <i>/ 03</i></span></div>

          <label className="field-label" htmlFor="application-name">What are you applying for? <span>*</span></label>
          <input id="application-name" className="text-input" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Future Leaders Scholarship" required minLength={3} />

          <div className="form-row">
            <div><label className="field-label" htmlFor="opportunity-type">Opportunity type</label>
              <select id="opportunity-type" className="text-input select-input" value={type} onChange={(event) => setType(event.target.value as OpportunityType)}>
                <option value="scholarship">Scholarship</option><option value="internship">Internship</option>
              </select>
            </div>
            <div><label className="field-label" htmlFor="organization">Organization <span className="optional">(optional)</span></label>
              <input id="organization" className="text-input" value={organization} onChange={(event) => setOrganization(event.target.value)} placeholder="Name of institution" />
            </div>
          </div>

          <div><label className="field-label" htmlFor="deadline">Application deadline <span className="optional">(if known)</span></label>
            <input id="deadline" className="text-input date-input" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
          </div>
          <div className="context-field"><label className="field-label" htmlFor="student-context">Notes about your situation <span className="optional">(optional)</span></label>
            <textarea id="student-context" className="text-input context-textarea" value={studentContext} onChange={(event) => setStudentContext(event.target.value)} placeholder="For example, your course of study or a detail you still need to verify." rows={2} />
          </div>

          <div className="form-divider" />
          <div className="field-label-row"><label className="field-label" htmlFor="source-text">Opportunity requirements text <span className="optional">(optional)</span></label><span className="optional">Paste exact text or upload a notice after creating</span></div>
          <textarea id="source-text" className="text-input source-textarea" value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder={"Paste the relevant requirements here, one per line.\n\nExample: Applicants must be enrolled full-time..."} rows={5} />
          <div className="form-note"><Info size={16} /><p>You can create a workspace with pasted requirements or add a notice later. Private uploads are extracted for search and only sent to the AI provider when you explicitly request an analysis.</p></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary submit-button" type="submit" disabled={saving}>{saving ? "Saving workspace…" : "Create my workspace"}<ArrowRight size={17} /></button>
          <div className="form-footnote">Saved to your account · Available across your devices</div>
        </form>
      </div>
    </main>
  );
}
