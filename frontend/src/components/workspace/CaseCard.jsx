const statusBadgeClass = (status) => {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "active" || normalized === "open") {
    return "badge badge--success";
  }
  if (normalized === "hold" || normalized.includes("hold")) {
    return "badge badge--warning";
  }
  if (normalized === "closed" || normalized === "completed") {
    return "badge badge--neutral";
  }
  return "badge badge--info";
};

const taskStatusClass = (status) => {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "completed" || normalized === "done") return "todo-item todo-item--completed";
  if (normalized === "blocked") return "todo-item todo-item--blocked";
  if (normalized === "planned") return "todo-item todo-item--planned";
  return "todo-item todo-item--in-progress";
};

const taskStatusLabel = (status) => {
  const normalized = (status ?? "").toLowerCase();
  switch (normalized) {
    case "completed":
      return "Completed";
    case "blocked":
      return "Blocked";
    case "planned":
      return "Planned";
    case "in-progress":
      return "In progress";
    default:
      return status ?? "Pending";
  }
};

export const CaseCard = ({ caseData }) => {
  if (!caseData) return null;
  const {
    name,
    status,
    priority,
    matterType,
    owner,
    openedOn,
    summary,
    aiContext,
    aiUsage,
    documents = [],
    personalDocuments = [],
    tasks = [],
    timeline = [],
    attorneys = []
  } = caseData;

  const combinedDocuments = [
    { title: "Case documents", list: documents },
    { title: "Personal information", list: personalDocuments }
  ];

  return (
    <section className="workspace-card workspace-card--full case-card">
      <header className="case-card__header">
        <div>
          <h3>{name}</h3>
          {summary ? <p className="muted">{summary}</p> : null}
        </div>
        <div className="case-card__chips">
          <span className={statusBadgeClass(status)}>{status ?? "Active"}</span>
          {priority ? <span className="badge badge--info">{priority} priority</span> : null}
        </div>
      </header>

      <div className="case-card__meta">
        <div className="case-card__meta-item">
          <span>Case owner</span>
          <strong>{owner ?? "Unassigned"}</strong>
        </div>
        <div className="case-card__meta-item">
          <span>Matter type</span>
          <strong>{matterType ?? "General"}</strong>
        </div>
        <div className="case-card__meta-item">
          <span>Opened</span>
          <strong>{openedOn ?? "TBD"}</strong>
        </div>
        <div className="case-card__meta-item">
          <span>AI focus</span>
          <strong>{aiContext?.focus ?? "Not configured"}</strong>
          <small className="muted">{aiContext?.lastUpdate ?? "No activity logged yet"}</small>
        </div>
        <div className="case-card__meta-item">
          <span>Assistant usage</span>
          <strong>{aiUsage?.messages ?? 0} messages</strong>
          <small className="muted">Last interaction {aiUsage?.lastInteraction ?? "—"}</small>
        </div>
      </div>

      <div className="case-card__section">
        <h4>Recommended counsel</h4>
        {attorneys.length ? (
          <div className="case-card__attorneys">
            {attorneys.map((attorney) => (
              <article key={attorney.id} className="case-card__attorney-card">
                <header>
                  <h5>{attorney.name}</h5>
                  <p className="muted">
                    {attorney.firm} | {attorney.focus}
                  </p>
                </header>
                <p>{attorney.reason}</p>
                <footer>
                  <span className="badge badge--info">{attorney.availability}</span>
                </footer>
              </article>
            ))}
          </div>
        ) : (
          <p className="muted">No recommended counsel yet. Add more case details to trigger a match.</p>
        )}
      </div>

      <div className="case-card__section">
        <h4>Documents</h4>
        <div className="case-card__documents">
          {combinedDocuments.map(({ title, list }) => (
            <div key={title} className="case-card__doc-group">
              <h5>{title}</h5>
              {list.length ? (
                <ul className="case-card__doc-list">
                  {list.map((doc) => (
                    <li key={doc.id} className="case-card__doc-item">
                      <strong>{doc.name}</strong>
                      <span className="muted">
                        Owner: {doc.owner ?? "Unknown"} | Uploaded {doc.uploadedOn ?? "—"}
                      </span>
                      <span className="case-card__doc-status">{doc.status ?? "Pending"}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No documents uploaded for this category.</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="case-card__section case-card__section--split">
        <div>
          <h4>Timeline</h4>
          {timeline.length ? (
            <ul className="timeline timeline--case">
              {timeline.map((event) => (
                <li key={event.id} className={`timeline__item timeline__item--${event.type ?? "note"}`}>
                  <div className="timeline__date">{event.displayDate ?? event.date}</div>
                  <div className="timeline__content">
                    <strong>{event.title}</strong>
                    <p className="muted">{event.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No timeline events yet.</p>
          )}
        </div>
        <div>
          <h4>Action items</h4>
          {tasks.length ? (
            <ul className="todo-list">
              {tasks.map((task) => (
                <li key={task.id} className={taskStatusClass(task.status)}>
                  <div>
                    <strong>{task.title}</strong>
                    <p className="muted">
                      Owner: {task.owner ?? "Unassigned"} | Due {task.due ?? "TBD"}
                    </p>
                  </div>
                  <span className="badge">{taskStatusLabel(task.status)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">All caught up. No open tasks for this case.</p>
          )}
        </div>
      </div>
    </section>
  );
};
