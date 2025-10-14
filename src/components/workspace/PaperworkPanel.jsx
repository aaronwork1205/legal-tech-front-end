import { formatDistanceToNow } from "date-fns";
import { useAssistant } from "../../state/assistantContext.jsx";

const formatRelative = (iso) => {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
};

const sanitizeDownloadName = (title) => title.toLowerCase().replace(/\s+/g, "-");

const describeSource = (source) => {
  if (!source) return "assistant conversation";
  if (source === "document-upload") return "document upload";
  if (source === "conversation") return "assistant conversation";
  return source.replace(/[-_]/g, " ");
};

export const PaperworkPanel = () => {
  const { paperwork, paperworkLog } = useAssistant();

  const latest = paperwork ?? paperworkLog[0] ?? null;
  const history = paperworkLog.slice(latest ? 1 : 0, 4);

  return (
    <section className="workspace-card">
      <header>
        <h3>Paperwork drafts</h3>
        <p className="muted">Agentic workflows assemble reference paperwork you can customise for clients.</p>
      </header>

      {latest ? (
        <article className="paperwork-card">
          <h4 style={{ margin: 0 }}>{latest.title}</h4>
          <p className="muted" style={{ margin: 0 }}>{latest.description}</p>
          {latest.matches?.length ? (
            <div className="agent-chat__tags">
              {latest.matches.map((match) => (
                <span key={match} className="upload-chip">
                  #{match.toUpperCase()}
                </span>
              ))}
            </div>
          ) : null}
          <footer>
            {latest.sampleUrl ? (
              <a
                className="btn btn-primary"
                href={latest.sampleUrl}
                download={`${sanitizeDownloadName(latest.title)}.pdf`}
              >
                Download sample PDF
              </a>
            ) : null}
            <span className="muted">
              Generated {formatRelative(latest.generatedAt)} · Source: {describeSource(latest.source)}
            </span>
          </footer>
        </article>
      ) : (
        <div className="agent-chat__empty">No paperwork generated yet. Upload documents or chat with LexiFlow.</div>
      )}

      {history.length ? (
        <div>
          <p className="muted" style={{ marginBottom: "0.6rem" }}>
            Previous drafts
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            {history.map((item) => (
              <li key={item.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <span>{item.title}</span>
                  <span className="muted">{formatRelative(item.generatedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
};
