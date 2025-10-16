import classcat from "classcat";
import { subscriptionTiers } from "../../data/subscriptions.js";

export const PlanSelector = ({ activePlan, onSelect }) => (
  <section id="plans" className="container plans-section">
    <header className="plans-header">
      <h2 className="section-title">Choose your subscription</h2>
      <p className="muted">
        Every tier unlocks deeper compliance automation and faster attorney response times tailored to your
        launch velocity.
      </p>
    </header>
    <div className="plans-grid">
      {subscriptionTiers.map((plan) => {
        const isActive = plan.id === activePlan;
        return (
          <article
            key={plan.id}
            className={classcat(["card", "plan-card", isActive && "featured"])}
            aria-current={isActive}
          >
            <div className="plan-meta">
              <span className="badge">{plan.id === "growth" ? "Most popular" : plan.name}</span>
              <span>
                {plan.currency} ¥{plan.price} / {plan.cadence}
              </span>
            </div>
            <p className="plan-price">
              ¥{plan.price}
              <small style={{ fontSize: "0.9rem", marginLeft: "0.35rem" }}>/ {plan.cadence}</small>
            </p>
            <ul className="plan-features">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <div>
              <p className="muted" style={{ marginBottom: "0.4rem" }}>
                Add-ons
              </p>
              <div className="plan-addons">
                {plan.addOns.map((addon) => (
                  <span key={addon} className="chip">
                    {addon}
                  </span>
                ))}
              </div>
            </div>
            <button
              className={classcat(["btn", isActive ? "btn-primary" : "btn-secondary"])}
              onClick={() => onSelect(plan.id)}
            >
              {isActive ? "Current plan" : "Switch to this plan"}
            </button>
          </article>
        );
      })}
    </div>
  </section>
);
