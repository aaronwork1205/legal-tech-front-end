import { subscriptionTiers } from "../../data/subscriptions.js";

const formatCurrency = (value, currency) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(value);

export const WorkspaceSnapshot = ({ user, currentPlan, usage, onPlanChange, planStatus }) => {
  const plan = currentPlan ?? subscriptionTiers[0];
  const allowance = plan.quota?.aiSessions;
  const allowanceLabel =
    typeof allowance === "number" ? `${usage.messages}/${allowance} conversations` : `${usage.messages} · ${allowance}`;

  const handleSelect = (event) => {
    const planId = event.target.value;
    if (planId && planId !== user?.subscription) {
      onPlanChange(planId);
    }
  };

  return (
    <section className="workspace-card workspace-card--wide">
      <header>
        <h3>Workspace snapshot</h3>
        <p className="muted">Monitor subscription, usage, and paperwork at a glance.</p>
      </header>

      <div className="workspace-metrics">
        <div className="workspace-metric">
          <span>Current plan</span>
          <strong>{plan.name}</strong>
          <small className="muted">
            {formatCurrency(plan.price, plan.currency)} / {plan.cadence}
          </small>
        </div>
        <div className="workspace-metric">
          <span>AI sessions</span>
          <strong>{allowanceLabel}</strong>
          <small className="muted">Messages logged with LexiFlow</small>
        </div>
        <div className="workspace-metric">
          <span>Documents analysed</span>
          <strong>{usage.documents}</strong>
          <small className="muted">Files scanned for automation</small>
        </div>
        <div className="workspace-metric">
          <span>Paperwork drafts</span>
          <strong>{usage.paperwork}</strong>
          <small className="muted">Generated from conversations + uploads</small>
        </div>
      </div>

      <div>
        <label className="form-label" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <span className="muted">Switch plan (instant effect)</span>
          <select className="select" value={user?.subscription ?? plan.id} onChange={handleSelect}>
            {subscriptionTiers.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.name} · {formatCurrency(tier.price, tier.currency)}/{tier.cadence}
              </option>
            ))}
          </select>
        </label>
        {planStatus ? <p className="muted" style={{ marginTop: "0.4rem" }}>{planStatus}</p> : null}
      </div>
    </section>
  );
};
