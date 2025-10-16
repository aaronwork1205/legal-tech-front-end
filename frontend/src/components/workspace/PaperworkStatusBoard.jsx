export const PaperworkStatusBoard = ({ signed, pending, className = "" }) => (
  <section className={`workspace-card workspace-card--wide ${className}`.trim()}>
    <header>
      <h3>Paperwork status</h3>
      <p className="muted">Track signed packages and drafts still in review.</p>
    </header>

    <div className="paperwork-board">
      <div className="paperwork-column">
        <h4>Signed & delivered</h4>
        <ul>
          {signed.map((item) => (
            <li key={item.id}>
              <div className="paperwork-row">
                <div>
                  <strong>{item.title}</strong>
                  <span className="muted">
                    Counsel: {item.attorney} | Delivered {item.delivered}
                  </span>
                </div>
                <span className="badge badge--success">Signed {item.signedDate}</span>
              </div>
            </li>
          ))}
          {signed.length === 0 ? <li className="muted">No executed paperwork yet.</li> : null}
        </ul>
      </div>
      <div className="paperwork-column">
        <h4>Awaiting attorney signature</h4>
        <ul>
          {pending.map((item) => (
            <li key={item.id}>
              <div className="paperwork-row">
                <div>
                  <strong>{item.title}</strong>
                  <span className="muted">
                    Owner: {item.owner} | Uploaded {item.uploaded}
                  </span>
                </div>
                <div className="paperwork-row__meta">
                  <span className="badge badge--warning">Deadline {item.deadline}</span>
                  <span className="muted">{item.status}</span>
                </div>
              </div>
            </li>
          ))}
          {pending.length === 0 ? <li className="muted">No open signatures at the moment.</li> : null}
        </ul>
      </div>
    </div>
  </section>
);
