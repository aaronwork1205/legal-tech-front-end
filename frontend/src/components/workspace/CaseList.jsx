const statusClass = (status) => {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "active") return "badge badge--success";
  if (normalized.includes("hold")) return "badge badge--warning";
  if (normalized === "draft") return "badge badge--info";
  if (normalized === "completed" || normalized === "closed") return "badge badge--neutral";
  return "badge";
};

export const CaseList = ({ cases, onSelect, activeCaseId, onCreate }) => (
  <section className="workspace-card workspace-card--full case-list">
    <header className="case-list__header">
      <div>
        <h3>Existing cases</h3>
        <p className="muted">
          {cases.length
            ? "Review the matters you have already drafted or handed to the assistant."
            : "No cases created yet. Start one to brief the assistant and attorneys."}
        </p>
      </div>
      <div className="case-list__header-actions">
        <span className="pill">
          {cases.length} case{cases.length === 1 ? "" : "s"}
        </span>
        {onCreate ? (
          <button type="button" className="btn btn-secondary" onClick={onCreate}>
            New case
          </button>
        ) : null}
      </div>
    </header>
    {cases.length ? (
      <ul className="case-list__items">
        {cases.map((caseItem) => {
          const isActive = caseItem.id === activeCaseId;
          return (
            <li key={caseItem.id} className={`case-list__item${isActive ? " case-list__item--active" : ""}`}>
              <div className="case-list__item-main">
                <strong>{caseItem.name}</strong>
                <span className="muted">
                  {caseItem.matterType ?? "General"} | Owner: {caseItem.owner ?? "Unassigned"}
                </span>
              </div>
              <div className="case-list__item-meta">
                <span className={statusClass(caseItem.status)}>{caseItem.status ?? "Draft"}</span>
                {caseItem.priority ? <span className="pill">{caseItem.priority} priority</span> : null}
                {isActive ? (
                  <span className="badge badge--info">In focus</span>
                ) : (
                  <button
                    type="button"
                    className="link"
                    onClick={() => (onSelect ? onSelect(caseItem) : undefined)}
                  >
                    Open case
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    ) : null}
  </section>
);
