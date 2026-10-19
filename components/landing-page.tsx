import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileText,
  LockKeyhole,
  Sparkles,
  Workflow,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Bring the requirements",
    body: "Start with the opportunity notice. Keep the original source close to every decision.",
    icon: FileText,
  },
  {
    number: "02",
    title: "See what needs attention",
    body: "Separate what you have from what still needs a closer look—without guessing.",
    icon: Workflow,
  },
  {
    number: "03",
    title: "Make a clear plan",
    body: "Turn open questions into manageable next steps and a final readiness check.",
    icon: ClipboardCheck,
  },
];

export default function LandingPage() {
  return (
    <main className="landing">
      <header className="marketing-header">
        <Link href="/" className="wordmark" aria-label="ClearPath home">
          <span className="brand-mark"><span /></span>
          <span>clearpath</span>
        </Link>
        <nav className="marketing-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#why-clearpath">Why ClearPath</a>
        </nav>
        <Link className="header-cta" href="/applications/new">
          Get started <ArrowUpRight size={15} />
        </Link>
      </header>

      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> A clearer way to apply</div>
          <h1>Make your next application easier to <em>get right.</em></h1>
          <p className="hero-lede">
            Understand what an opportunity asks for, organize your evidence, and
            catch open questions before you submit.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary button-large" href="/applications/new">
              Check my application <ArrowRight size={17} />
            </Link>
            <a className="text-link" href="#how-it-works">
              See how it works <ArrowDown size={15} />
            </a>
          </div>
          <Link className="demo-link" href="/applications/demo/assessment"><span>New here?</span> Try the guided demo <ArrowRight size={14} /></Link>
          <div className="hero-proof">
            <span className="proof-icon"><LockKeyhole size={15} /></span>
            <span>Your documents stay in this browser in the demo.</span>
          </div>
        </div>

        <div className="preview-wrap" aria-label="Preview of an application readiness review">
          <div className="preview-orbit orbit-one" />
          <div className="preview-orbit orbit-two" />
          <div className="preview-card">
            <div className="preview-topline">
              <div className="mini-brand"><span className="brand-mark small"><span /></span> clearpath</div>
              <span className="preview-label">SAMPLE PREVIEW · FICTIONAL DATA</span>
            </div>
            <div className="preview-title-row">
              <div>
                <div className="preview-kicker">SCHOLARSHIP · NORTHSTAR FOUNDATION</div>
                <h2>Future Leaders<br />Scholarship</h2>
              </div>
              <div className="preview-seal"><FileCheck2 size={20} /></div>
            </div>
            <div className="preview-progress">
              <div className="preview-progress-label"><span>Requirements overview</span><span>5 items</span></div>
              <div className="preview-overview-legend"><span><i className="legend-dot noted" />2 noted</span><span><i className="legend-dot review" />2 to check</span><span><i className="legend-dot todo" />1 missing</span></div>
            </div>
            <div className="preview-requirements">
              <div className="preview-requirement">
                <span className="requirement-icon good"><Check size={14} /></span>
                <div><b>Full-time enrolment</b><small>Evidence noted · confirm details</small></div>
                <span className="tiny-state state-good">ON TRACK</span>
              </div>
              <div className="preview-requirement">
                <span className="requirement-icon review"><span /></span>
                <div><b>Minimum GPA of 3.2</b><small>Transcript attached · needs review</small></div>
                <span className="tiny-state state-review">REVIEW</span>
              </div>
              <div className="preview-requirement">
                <span className="requirement-icon missing"><span /></span>
                <div><b>Faculty recommendation</b><small>Not yet in your checklist</small></div>
                <span className="tiny-state state-missing">TO DO</span>
              </div>
            </div>
            <div className="preview-source">
              <span className="source-mark"><FileText size={14} /></span>
              <span>“One letter of recommendation from a faculty member is required.”</span>
              <span className="source-page">SOURCE · NOTICE</span>
            </div>
            <div className="preview-footer"><Sparkles size={14} /> A checklist grounded in the details you provide.</div>
          </div>
          <div className="floating-note"><CheckCircle2 size={16} /><span><b>Keep the source close</b><small>Every check has a reason.</small></span></div>
        </div>
      </section>

      <section className="trust-strip" id="why-clearpath">
        <span>Less second-guessing.</span><i />
        <span>More evidence-led decisions.</span><i />
        <span>Your application, your call.</span>
      </section>

      <section className="how-section section-wrap" id="how-it-works">
        <div className="section-intro">
          <div className="eyebrow">A calmer application process</div>
          <h2>From confusing requirements<br />to a plan you can follow.</h2>
          <p>ClearPath helps you see what is known, what is missing, and what to do next.</p>
        </div>
        <div className="steps-grid">
          {steps.map(({ number, title, body, icon: Icon }) => (
            <article className="step-card" key={number}>
              <div className="step-top"><span>{number}</span><Icon size={20} strokeWidth={1.65} /></div>
              <h3>{title}</h3><p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="privacy-band">
        <div className="privacy-icon"><LockKeyhole size={19} /></div>
        <div><h2>Built around clarity, not guarantees.</h2><p>ClearPath helps you prepare against the information you provide. It cannot confirm official eligibility or promise an award, interview, or offer.</p></div>
        <Link href="/applications/new" className="privacy-link">Start a review <ArrowRight size={16} /></Link>
      </section>

      <footer className="site-footer">
        <Link href="/" className="wordmark"><span className="brand-mark"><span /></span><span>clearpath</span></Link>
        <span>Make the next step a clear one.</span>
        <span className="footer-note">A preparation tool · Not an official eligibility decision</span>
      </footer>
    </main>
  );
}
