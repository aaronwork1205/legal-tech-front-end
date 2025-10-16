const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
    weekday: "short"
  });

export const ActivityTimeline = ({ events, className = "" }) => (
  <section className={`workspace-card ${className}`.trim()}>
    <header>
      <h3>Calendar timeline</h3>
      <p className="muted">Uploads, deadlines, and attorney responses at a glance.</p>
    </header>

    <ul className="timeline">
      {events.map((event) => (
        <li key={event.id} className={`timeline__item timeline__item--${event.type}`}>
          <div className="timeline__date">{formatDate(event.date)}</div>
          <div className="timeline__content">
            <strong>{event.title}</strong>
            <p className="muted">{event.description}</p>
            <div className="timeline__meta">
              {event.deadline ? <span>DDL: {event.deadline}</span> : null}
              {event.owner ? <span>Owner: {event.owner}</span> : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  </section>
);
