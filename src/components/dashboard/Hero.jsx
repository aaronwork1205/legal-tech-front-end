import { Link } from "react-router-dom";

export const Hero = ({ subscription, verified }) => (
  <section className="container grid hero-grid">
    <div className="hero-copy">
      <h1 className="section-title">
        Deliver instant, trustworthy legal guidance for your SaaS customers
      </h1>
      <p className="muted">
        LexiFlow brings identity verification, agentic AI conversations, and curated attorney
        matching together so your teams can resolve compliance and contract issues before they
        block shipping.
      </p>
      <div className="hero-actions">
        <Link className="btn btn-primary" to="/dashboard#assistant">
          Start a legal intake
        </Link>
        <Link className="btn btn-secondary" to="/dashboard#plans">
          Compare plans
        </Link>
      </div>
      <div className="trust-badges">
        <span className="pill">GDPR & ISO27001 Ready</span>
        <span className="pill">99.9% SLA</span>
        <span className="pill">Trusted by 120+ legal teams</span>
      </div>
    </div>
    <article className="surface hero-card">
      <h3>Workspace health</h3>
      <dl className="workspace-stats">
        <div>
          <dt>Subscription</dt>
          <dd>{subscription?.name ?? "Trial"}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{verified ? "Verified workspace" : "Email verification pending"}</dd>
        </div>
        <div>
          <dt>Live conversations</dt>
          <dd>3 active threads</dd>
        </div>
        <div>
          <dt>Attorney turnaround</dt>
          <dd>Under 4 hours</dd>
        </div>
      </dl>
    </article>
  </section>
);
