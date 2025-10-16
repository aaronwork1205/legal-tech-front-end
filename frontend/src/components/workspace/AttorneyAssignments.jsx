export const AttorneyAssignments = ({ assignments, className = "" }) => (
  <section className={`workspace-card ${className}`.trim()}>
    <header>
      <h3>Assigned attorneys</h3>
      <p className="muted">Active matters and the specialists driving them.</p>
    </header>

    <div className="attorney-grid">
      {assignments.map((attorney) => (
        <article key={attorney.id} className="attorney-card">
          <header className="attorney-card__header">
            <div>
              <h4>{attorney.name}</h4>
              <p className="muted">
                {attorney.firm} | {attorney.focus}
              </p>
            </div>
            <span className="pill">{attorney.stage}</span>
          </header>
          <dl className="attorney-card__details">
            <div>
              <dt>Next milestone</dt>
              <dd>{attorney.nextMilestone}</dd>
            </div>
            <div>
              <dt>Last activity</dt>
              <dd>{attorney.lastActivity}</dd>
            </div>
            <div>
              <dt>Channel</dt>
              <dd>{attorney.channel}</dd>
            </div>
          </dl>
          <footer className="attorney-card__footer">
            <button className="btn btn-secondary" type="button">
              View timeline
            </button>
            <button className="btn btn-primary" type="button">
              Share update
            </button>
          </footer>
        </article>
      ))}
    </div>
  </section>
);
