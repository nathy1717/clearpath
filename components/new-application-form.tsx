"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Info,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from "lucide-react";
import {
  ClearpathApplication,
  extractManualRequirements,
  OpportunityType,
} from "@/lib/domain";
import { makeId, saveApplication } from "@/lib/storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];

export default function NewApplicationForm() {
  const router = useRouter();
  const sourceInput = useRef<HTMLInputElement>(null);
  const evidenceInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<OpportunityType>("scholarship");
  const [organization, setOrganization] = useState("");
  const [deadline, setDeadline] = useState("");
  const [studentContext, setStudentContext] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [supportingFiles, setSupportingFiles] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function addFiles(event: ChangeEvent<HTMLInputElement>, required: boolean) {
    setError("");
    const files = Array.from(event.target.files ?? []);
    const accepted: string[] = [];
    for (const file of files) {
      const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        setError(`${file.name} is not supported. Choose a PDF, DOCX, or TXT file.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} is larger than the 10 MB limit.`);
        continue;
      }
      accepted.push(file.name);
    }
    if (required && accepted.length) setSourceName(accepted[0]);
    if (!required && accepted.length) {
      setSupportingFiles((current) => [...new Set([...current, ...accepted])]);
    }
    event.target.value = "";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (name.trim().length < 3) {
      setError("Add an application name with at least 3 characters.");
      return;
    }
    if (sourceText.trim().length < 20) {
      setError("Paste at least 20 characters of the opportunity requirements. Files are not read in this demo.");
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
      sourceName: sourceName || "Requirements pasted by you",
      supportingFiles,
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
      saveApplication(application);
      router.push(`/applications/${id}/assessment`);
    } catch {
      setSaving(false);
      setError("This browser could not save the workspace. Check available storage and try again.");
    }
  }

  return (
    <main className="create-page">
      <header className="create-header">
        <Link href="/" className="wordmark"><span className="brand-mark"><span /></span><span>clearpath</span></Link>
        <span className="create-header-note"><LockKeyhole size={14} /> Your workspace stays on this device</span>
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
          <div className="create-privacy"><ShieldCheck size={17} /><span>In this demo, files are not uploaded. Only file names and details you type are saved locally in your browser.</span></div>
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
          <div className="field-label-row"><label className="field-label" htmlFor="source-text">Opportunity requirements text <span>*</span></label><span className="optional">Paste exact text to review</span></div>
          <textarea id="source-text" className="text-input source-textarea" value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder={"Paste the relevant requirements here, one per line.\n\nExample: Applicants must be enrolled full-time..."} rows={5} />
          <div className="upload-strip">
            <input ref={sourceInput} className="visually-hidden" type="file" aria-label="Choose an opportunity requirements file" tabIndex={-1} accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={(event) => addFiles(event, true)} />
            <button type="button" className="upload-button" onClick={() => sourceInput.current?.click()}><UploadCloud size={16} /> Add a file name for reference</button>
            <span className="upload-hint">PDF, DOCX or TXT · up to 10 MB · file contents are not read</span>
          </div>
          {sourceName && <div className="file-chip"><FileText size={15} /><span>{sourceName}</span><button type="button" aria-label="Remove opportunity notice" onClick={() => setSourceName("")}><Trash2 size={14} /></button></div>}

          <div className="supporting-row">
            <div><div className="field-label">Supporting documents <span className="optional">Optional</span></div><p>Add file names to your checklist. Contents are not read in this demo.</p></div>
            <input ref={evidenceInput} className="visually-hidden" type="file" aria-label="Choose supporting documents" tabIndex={-1} multiple accept=".pdf,.docx,.txt" onChange={(event) => addFiles(event, false)} />
            <button type="button" className="icon-button add-file-button" onClick={() => evidenceInput.current?.click()} aria-label="Add supporting documents"><Plus size={17} /></button>
          </div>
          {supportingFiles.length > 0 && <div className="file-list">{supportingFiles.map((file) => <div className="file-chip" key={file}><FileText size={15} /><span>{file}</span><button type="button" aria-label={`Remove ${file}`} onClick={() => setSupportingFiles((current) => current.filter((item) => item !== file))}><Trash2 size={14} /></button></div>)}</div>}

          <div className="form-note"><Info size={16} /><p>This workspace organizes the information you provide; it does not independently verify eligibility or analyze attached file contents.</p></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary submit-button" type="submit" disabled={saving}>{saving ? "Saving workspace…" : "Create my workspace"}<ArrowRight size={17} /></button>
          <div className="form-footnote">No account needed · Saved in this browser only</div>
        </form>
      </div>
    </main>
  );
}
