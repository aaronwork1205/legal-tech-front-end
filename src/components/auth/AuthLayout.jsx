import { Link } from "react-router-dom";
import "./auth.css";

export const AuthLayout = ({ title, subtitle, children, footer }) => (
  <div className="auth-page">
    <div className="auth-card">
      <header className="auth-header">
        <Link to="/" className="auth-logo">
          <span className="logo-text">LexiFlow</span>
        </Link>
        <h1>{title}</h1>
        {subtitle ? <p className="muted">{subtitle}</p> : null}
      </header>
      <div className="auth-body">{children}</div>
      {footer ? <footer className="auth-footer">{footer}</footer> : null}
    </div>
    <aside className="auth-sidecard">
      <h2>Why legal teams choose LexiFlow</h2>
      <ul>
        <li>Agentic workflows orchestrate AI guidance and real attorneys.</li>
        <li>Workspace security with SSO, MFA, and audit trails baked in.</li>
        <li>Dynamic subscription tiers aligned to your launch velocity.</li>
      </ul>
      <p className="muted">
        Need a guided demo? <Link to="/signup">Talk to us</Link> and we will tailor a rollout plan.
      </p>
    </aside>
  </div>
);
