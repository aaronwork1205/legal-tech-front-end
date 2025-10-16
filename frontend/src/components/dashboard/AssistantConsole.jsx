import { useAssistant } from "../../state/assistantContext.jsx";
import classcat from "classcat";

export const AssistantConsole = () => {
  const { messages, recommendations, summary, processing, error, sendMessage } = useAssistant();

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = form.get("message");
    sendMessage(String(message ?? ""));
    event.currentTarget.reset();
  };

  return (
    <div id="assistant" className="container surface assistant-section">
      <header className="assistant-header">
        <div>
          <h2>LexiFlow agentic legal assistant</h2>
          <p className="muted">
            The assistant tracks conversation context, mirrors applicable regulation, and invites subject-matter
            attorneys when intervention is needed.
          </p>
        </div>
      </header>
      <div className="assistant-grid">
        <aside className="card case-summary">
          <h3>Case summary</h3>
          <div className="summary-block">
            <strong>Current risk</strong>
            <p className="summary-risk">{summary.risk}</p>
          </div>
          <div className="summary-block">
            <strong>Next steps</strong>
            <ul className="summary-steps">
              {summary.nextSteps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="summary-block">
            <strong>Recommended attorneys</strong>
            <div className="recommended-lawyers">
              {recommendations.map((lawyer) => (
                <article key={lawyer.id} className="lawyer-card">
                  <span className="lawyer-id">{lawyer.name.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <p>{lawyer.name}</p>
                    <small className="muted">
                      {lawyer.expertise} · {lawyer.experience} · {lawyer.location}
                    </small>
                  </div>
                  <button className="btn btn-secondary">Book</button>
                </article>
              ))}
            </div>
          </div>
        </aside>
        <section className="card assistant-window">
          <div className="assistant-history">
            {messages.map((message) => (
              <div key={message.id} className={classcat(["chat-bubble", message.role])}>
                <div className="chat-meta">
                  {message.role === "assistant" ? "LexiFlow" : "You"} · {message.createdAt}
                </div>
                <p>{message.content}</p>
                {message.tags?.length ? (
                  <div className="chat-tags">
                    {message.tags.map((tag) => (
                      <span key={tag} className="chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <form className="assistant-form" onSubmit={handleSubmit}>
            <label className="form-label">
              Ask a question
              <textarea
                className="textarea"
                name="message"
                placeholder="For example: What contract updates are needed before launching a new feature in the US?"
                required
              />
            </label>
            <div className="assistant-footer">
              <label className="form-label" style={{ flex: "1 1 220px" }}>
                <span className="muted">Share context with workspace</span>
                <select name="contextShare" className="select" defaultValue="team">
                  <option value="team">Sync with legal operations</option>
                  <option value="exec">Escalate to leadership</option>
                  <option value="private">Keep private</option>
                </select>
              </label>
              <button className="btn btn-primary" type="submit" disabled={processing}>
                {processing ? "Thinking..." : "Send"}
              </button>
            </div>
            {error ? <p className="error-text">{error}</p> : null}
          </form>
        </section>
      </div>
    </div>
  );
};
