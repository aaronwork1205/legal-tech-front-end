import classcat from "classcat";
import { useAssistant } from "../../state/assistantContext.jsx";

export const AgentChat = () => {
  const { messages, summary, sendMessage, processing, error, usage, paperwork } = useAssistant();

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = form.get("message");
    sendMessage(String(message ?? ""));
    event.currentTarget.reset();
  };

  return (
    <section className="agent-chat">
      <div className="agent-chat__header">
        <h3>AI conversation console</h3>
        <p className="muted">
          Chat with LexiFlow to triage matters, surface regulations, and request generated paperwork.
        </p>
        <div className="usage-badges">
          <span className="usage-badge">Messages {usage.messages}</span>
          <span className="usage-badge">Documents {usage.documents}</span>
          <span className="usage-badge">Paperwork {usage.paperwork}</span>
        </div>
        {paperwork ? (
          <div className="paperwork-card" style={{ marginTop: "0.6rem" }}>
            <strong>Latest draft: {paperwork.title}</strong>
            <p className="muted" style={{ margin: 0 }}>{paperwork.description}</p>
            {paperwork.sampleUrl ? (
              <a
                className="btn btn-secondary"
                href={paperwork.sampleUrl}
                download={`${paperwork.title.toLowerCase().replace(/\s+/g, "-")}.pdf`}
              >
                Download sample PDF
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="agent-chat__history">
        {messages.length ? (
          messages.map((message) => (
            <div key={message.id} className={classcat(["agent-chat__bubble", message.role])}>
              <div className="agent-chat__meta">
                {message.role === "assistant" ? "LexiFlow" : "You"} · {message.createdAt}
              </div>
              <p style={{ margin: 0 }}>{message.content}</p>
              {message.tags?.length ? (
                <div className="agent-chat__tags">
                  {message.tags.map((tag) => (
                    <span key={tag} className="upload-chip">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <div className="agent-chat__empty">
            Start the conversation with compliance or contract questions to see LexiFlow in action.
          </div>
        )}
      </div>

      <div>
        <h4 style={{ margin: "0 0 0.4rem" }}>Current plan</h4>
        <p className="muted" style={{ margin: 0 }}>
          {summary.risk}. Next steps:
        </p>
        <ul style={{ margin: "0.6rem 0 0", paddingLeft: "1rem", color: "var(--muted)" }}>
          {summary.nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </div>

      <form className="agent-chat__form" onSubmit={handleSubmit}>
        <label className="form-label">
          <span>Ask the assistant</span>
          <textarea
            className="textarea"
            name="message"
            placeholder="For example: Outline GDPR transfer requirements for our payroll vendor in Germany."
            required
          />
        </label>
        <div className="agent-chat__controls">
          <span className="muted">
            Responses are guidance only. Escalate to verified counsel before execution.
          </span>
          <button className="btn btn-primary" type="submit" disabled={processing}>
            {processing ? "Thinking..." : "Send"}
          </button>
        </div>
        {error ? <p className="error-text">{error}</p> : null}
      </form>
    </section>
  );
};
