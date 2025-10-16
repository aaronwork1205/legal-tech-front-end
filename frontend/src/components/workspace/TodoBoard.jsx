export const TodoBoard = ({ items, className = "" }) => (
  <section className={`workspace-card ${className}`.trim()}>
    <header>
      <h3>Follow-up checklist</h3>
      <p className="muted">Keep counsel and internal owners aligned on next steps.</p>
    </header>

    <ul className="todo-list">
      {items.map((item) => (
        <li key={item.id} className={`todo-item todo-item--${item.status}`}>
          <div>
            <strong>{item.title}</strong>
            <p className="muted">
              Owner: {item.owner} | Due {item.due}
            </p>
          </div>
          <span className="badge">{item.statusLabel}</span>
        </li>
      ))}
    </ul>
  </section>
);
