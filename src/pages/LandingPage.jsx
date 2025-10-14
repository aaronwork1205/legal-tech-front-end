import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell.jsx";
import { Testimonials } from "../components/dashboard/Testimonials.jsx";
import { subscriptionTiers } from "../data/subscriptions.js";
import "../components/dashboard/dashboard.css";

const LandingPage = () => (
  <AppShell>
    <div className="page">
      <section className="container grid hero-grid">
        <div className="hero-copy">
          <h1 className="section-title">AI-native legal partner for your SaaS roadmap</h1>
          <p className="muted">
            Automate intake, route to the right attorney, and keep every regulatory change at your fingertips. LexiFlow
            de-risks launches so product teams stay focused on impact.
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/signup">
              Start free
            </Link>
            <Link className="btn btn-secondary" to="/login">
              Sign in
            </Link>
          </div>
          <div className="trust-badges">
            <span className="pill">Agentic workflows</span>
            <span className="pill">Pre-vetted attorney pool</span>
            <span className="pill">Enterprise-grade security</span>
          </div>
        </div>
        <article className="surface hero-card">
          <h3>What you orchestrate</h3>
          <ul className="summary-steps">
            <li>Identity-first onboarding with verification and MFA controls</li>
            <li>AI-led issue scoping, risk classification, and legal briefs</li>
            <li>Attorney escalation with availability and expertise filters</li>
            <li>Subscription governance mapped to team growth</li>
          </ul>
        </article>
      </section>

      <section className="container plans-section">
        <h2 className="section-title">Flexible tiers aligned to your runway</h2>
        <div className="plans-grid">
          {subscriptionTiers.map((plan) => (
            <article key={plan.id} className="card plan-card">
              <p className="plan-price">
                ¥{plan.price}
                <small style={{ fontSize: "0.9rem", marginLeft: "0.35rem" }}>/ {plan.cadence}</small>
              </p>
              <ul className="plan-features">
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <Link className="btn btn-secondary" to="/signup">
                Choose {plan.name}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <Testimonials />
    </div>
  </AppShell>
);

export default LandingPage;
