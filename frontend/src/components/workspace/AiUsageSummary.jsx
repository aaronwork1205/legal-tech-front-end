export const AiUsageSummary = ({ usage, trend, highlights, className = "" }) => (
  <section className={`workspace-card ${className}`.trim()}>
    <header>
      <h3>AI usage</h3>
      <p className="muted">Review how teams leverage LexiFlow this week.</p>
    </header>

    <div className="ai-usage__metrics">
      <div className="ai-usage__metric">
        <span>Messages</span>
        <strong>{usage.messages}</strong>
        <small className="muted">Conversations logged</small>
      </div>
      <div className="ai-usage__metric">
        <span>Paperwork generated</span>
        <strong>{usage.paperwork}</strong>
        <small className="muted">Drafts from AI workflows</small>
      </div>
      <div className="ai-usage__metric">
        <span>Documents referenced</span>
        <strong>{usage.documents}</strong>
        <small className="muted">Uploaded for context</small>
      </div>
    </div>

    <div className="ai-usage__trend">
      {trend.map((point) => (
        <div key={point.label} className="ai-usage__trend-row">
          <span>{point.label}</span>
          <div className="ai-usage__trend-bar">
            <div style={{ width: `${point.value}%` }} />
          </div>
          <span className="muted">{point.total} msgs</span>
        </div>
      ))}
    </div>

    <div className="ai-usage__highlights">
      <p className="muted" style={{ marginBottom: "0.4rem" }}>
        Top consumers
      </p>
      <div className="ai-usage__chips">
        {highlights.map((highlight) => (
          <span key={highlight.id} className="pill">
            {highlight.label} | {highlight.usage} msgs
          </span>
        ))}
      </div>
    </div>
  </section>
);
