import { useAssistant } from "../../state/assistantContext.jsx";

export const AttorneySpotlight = () => {
  const { recommendations, paperwork } = useAssistant();

  return (
    <section className="workspace-card">
      <header>
        <h3>Attorney spotlight</h3>
        <p className="muted">
          {paperwork
            ? `Recommended specialists aligned with the ${paperwork.title.toLowerCase()}.`
            : "LexiFlow highlights attorneys that frequently resolve matters like yours."}
        </p>
      </header>

      {recommendations.length ? (
        <div className="attorney-list">
          {recommendations.map((attorney) => (
            <article key={attorney.id} className="attorney-card">
              <h4 style={{ margin: 0 }}>{attorney.name}</h4>
              <p className="attorney-card__meta">
                {attorney.expertise} · {attorney.experience} · {attorney.location}
              </p>
              <footer>
                <button className="btn btn-secondary" type="button">
                  Book intro
                </button>
                <button className="btn btn-primary" type="button">
                  View profile
                </button>
              </footer>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted" style={{ margin: 0 }}>
          No recommendations yet. Share more context or upload a document to surface attorneys.
        </p>
      )}
    </section>
  );
};
