"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  FileText,
  LockKeyhole,
  RefreshCw,
  Sparkles,
  Trash2,
  TriangleAlert,
  UploadCloud,
} from "lucide-react";
import { ClearpathApplication } from "@/lib/domain";

type DocumentRole = "opportunity_notice" | "supporting_evidence";

interface ApplicationDocument {
  id: string;
  filename: string;
  content_type: string;
  byte_size: number;
  document_role: DocumentRole;
  created_at: string;
}

async function responseError(response: Response) {
  const body = await response.json().catch(() => null) as { error?: string } | null;
  return body?.error ?? `Request failed (${response.status}).`;
}

export default function DocumentManager({
  applicationId,
  onAnalyzed,
}: {
  applicationId: string;
  onAnalyzed: (application: ClearpathApplication) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [role, setRole] = useState<DocumentRole>("supporting_evidence");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function refreshDocuments() {
    const response = await fetch(`/api/applications/${encodeURIComponent(applicationId)}/documents`);
    if (!response.ok) throw new Error(await responseError(response));
    const result = await response.json() as { documents: ApplicationDocument[] };
    setDocuments(result.documents);
  }

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`/api/applications/${encodeURIComponent(applicationId)}/documents`);
        if (!response.ok) throw new Error(await responseError(response));
        const result = await response.json() as { documents: ApplicationDocument[] };
        if (active) setDocuments(result.documents);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Documents could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [applicationId]);

  async function uploadFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    setError("");
    setMessage("");
    setUploading(true);
    const failures: string[] = [];
    for (const file of files) {
      const body = new FormData();
      body.set("file", file);
      body.set("role", role);
      try {
        const response = await fetch(
          `/api/applications/${encodeURIComponent(applicationId)}/documents`,
          { method: "POST", body },
        );
        if (!response.ok) failures.push(`${file.name}: ${await responseError(response)}`);
      } catch (uploadError) {
        failures.push(`${file.name}: ${uploadError instanceof Error ? uploadError.message : "Upload failed."}`);
      }
    }
    try {
      await refreshDocuments();
    } catch (refreshError) {
      failures.push(refreshError instanceof Error ? refreshError.message : "Document list could not be refreshed.");
    }
    setUploading(false);
    setError(failures.join(" "));
    if (failures.length === 0) setMessage(`${files.length} document${files.length === 1 ? "" : "s"} privately uploaded and text extracted.`);
  }

  async function deleteDocument(document: ApplicationDocument) {
    if (!window.confirm(`Delete “${document.filename}”? This permanently removes the private file and extracted text.`)) return;
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `/api/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(document.id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error(await responseError(response));
      await refreshDocuments();
      setMessage("Document and extracted text deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "The document could not be deleted.");
    }
  }

  async function analyze() {
    setError("");
    setMessage("");
    setAnalyzing(true);
    try {
      const response = await fetch(
        `/api/applications/${encodeURIComponent(applicationId)}/analyze`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ consent }),
        },
      );
      if (!response.ok) throw new Error(await responseError(response));
      const result = await response.json() as { application: ClearpathApplication };
      onAnalyzed(result.application);
      setMessage("Preliminary analysis complete. Review the extracted requirements and confirm each item yourself.");
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "The analysis could not be completed.");
    } finally {
      setAnalyzing(false);
    }
  }

  function formatSize(bytes: number) {
    return bytes < 1024 * 1024
      ? `${Math.ceil(bytes / 1024)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <section className="document-manager" aria-labelledby="document-manager-title">
      <div className="section-head-row">
        <div><div className="eyebrow">PRIVATE DOCUMENTS</div><h2 id="document-manager-title">Your source material</h2></div>
        <span className="requirement-total">{documents.length} / 25 files</span>
      </div>
      <p className="document-manager-intro">PDF, DOCX, and UTF-8 TXT files up to 10 MB each. Files are checked, privately stored, and text is extracted on the server. Scanned PDFs are not supported.</p>

      <div className="document-upload-controls">
        <label className="status-edit" htmlFor="document-role">Document purpose
          <select id="document-role" value={role} onChange={(event) => setRole(event.target.value as DocumentRole)}>
            <option value="opportunity_notice">Opportunity notice</option>
            <option value="supporting_evidence">My supporting evidence</option>
          </select>
        </label>
        <input
          ref={input}
          className="visually-hidden"
          type="file"
          multiple
          accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={uploadFiles}
          aria-label="Upload PDF, DOCX, or TXT documents"
        />
        <button type="button" className="button button-secondary" onClick={() => input.current?.click()} disabled={uploading}>
          {uploading ? <RefreshCw size={15} className="spin-icon" /> : <UploadCloud size={15} />}
          {uploading ? "Uploading and extracting…" : "Upload documents"}
        </button>
      </div>

      {error && <div className="storage-error" role="alert"><TriangleAlert size={15} />{error}</div>}
      {message && <p className="document-manager-message" role="status">{message}</p>}
      {loading && <p className="document-manager-intro">Loading documents…</p>}
      {!loading && documents.length === 0 && <div className="document-empty"><FileText size={19} /><span>No uploaded documents yet. You can also analyze the requirements pasted into this workspace.</span></div>}
      {documents.length > 0 && (
        <div className="uploaded-document-list">
          {documents.map((document) => (
            <div className="uploaded-document" key={document.id}>
              <FileText size={17} />
              <span className="uploaded-document-name"><b>{document.filename}</b><small>{document.document_role === "opportunity_notice" ? "Opportunity notice" : "Supporting evidence"} · {formatSize(document.byte_size)}</small></span>
              <a
                className="document-icon-link"
                href={`/api/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(document.id)}`}
                aria-label={`Download ${document.filename}`}
              ><ArrowDownToLine size={15} /></a>
              <button type="button" className="document-icon-button" onClick={() => void deleteDocument(document)} aria-label={`Delete ${document.filename}`}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="ai-analysis-callout">
        <div className="ai-analysis-heading"><Sparkles size={16} /><b>AI-assisted requirement review</b></div>
        <p>Extracts requirements from pasted text and opportunity notices, then suggests related evidence excerpts. Suggestions remain unverified until you review them.</p>
        <label className="ai-consent">
          <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
          <span>I agree to send the pasted requirements and extracted text from uploaded documents to OpenAI through Vercel AI Gateway for this analysis.</span>
        </label>
        <div className="ai-analysis-footer">
          <span><LockKeyhole size={13} /> Analysis is user-requested and limited per account.</span>
          <button type="button" className="button button-primary" onClick={() => void analyze()} disabled={!consent || analyzing || uploading}>
            {analyzing ? "Analyzing…" : "Analyze requirements"}
            {analyzing ? <RefreshCw size={14} className="spin-icon" /> : <Sparkles size={14} />}
          </button>
        </div>
      </div>
    </section>
  );
}
