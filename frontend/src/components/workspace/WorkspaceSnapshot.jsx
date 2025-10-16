import { subscriptionTiers } from "../../data/subscriptions.js";

const formatCurrency = (value, currency) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(value);

export const WorkspaceSnapshot = ({ user, currentPlan, onPlanChange, planStatus, metrics }) => {
  const plan = currentPlan ?? subscriptionTiers[0];
  const {
    totalCases = 0,
    activeCases = 0,
    counselEngaged = 0,
    pendingDocuments = 0,
    aiMessages = 0
  } = metrics ?? {};
  const aiSessionsLabel = `${aiMessages} messages logged`;

  const handleSelect = (event) => {
    const planId = event.target.value;
    if (planId && planId !== user?.subscription) {
      onPlanChange(planId);
    }
  };

  return (
    <section className="workspace-card workspace-card--full">
      <header>
        <h3>Workspace snapshot</h3>
        <p className="muted">Stay aligned on counsel coverage, paperwork progress, and subscription details.</p>
      </header>

      <div className="workspace-metrics">
        <div className="workspace-metric">
          <span>Active cases</span>
          <strong>{activeCases}</strong>
          <small className="muted">{totalCases} total matters</small>
        </div>
        <div className="workspace-metric">
          <span>Assigned counsel</span>
          <strong>{counselEngaged}</strong>
          <small className="muted">Specialists currently engaged</small>
        </div>
        <div className="workspace-metric">
          <span>Awaiting documents</span>
          <strong>{pendingDocuments}</strong>
          <small className="muted">Items pending attorney review</small>
        </div>
        <div className="workspace-metric">
          <span>AI usage</span>
          <strong>{aiSessionsLabel}</strong>
          <small className="muted">Assistant touchpoints across cases</small>
        </div>
      </div>

      <div>
        <label className="form-label" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <span className="muted">Switch plan (instant effect)</span>
          <select className="select" value={user?.subscription ?? plan.id} onChange={handleSelect}>
            {subscriptionTiers.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.name} | {formatCurrency(tier.price, tier.currency)}/{tier.cadence}
              </option>
            ))}
          </select>
        </label>
        {planStatus ? <p className="muted" style={{ marginTop: "0.4rem" }}>{planStatus}</p> : null}
      </div>
    </section>
  );
};
