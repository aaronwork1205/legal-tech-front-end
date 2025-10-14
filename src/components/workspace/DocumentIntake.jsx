import { useAssistant } from "../../state/assistantContext.jsx";

const formatBytes = (size) => {
  if (!size) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const power = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  return `${(size / Math.pow(1024, power)).toFixed(power === 0 ? 0 : 1)} ${units[power]}`;
};

const formatTimestamp = (iso) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

export const DocumentIntake = () => {
  const { uploadDocument, uploads, uploading } = useAssistant();

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadDocument(file);
    }
    event.target.value = "";
  };

  return (
    <section className="workspace-card workspace-card--wide">
      <header>
        <h3>Document intake</h3>
        <p className="muted">
          Upload evidence or user files. LexiFlow inspects the content to detect jurisdictions, topics, and paperwork.
        </p>
      </header>

      <div className="document-upload">
        <p className="muted" style={{ margin: 0 }}>
          Drag & drop or choose a file. We support TXT, PDF exports, and DOCX (converted to text client-side).
        </p>
        <label className="btn btn-secondary document-upload__button">
          <input
            type="file"
            accept=".txt,.pdf,.doc,.docx,.rtf"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          {uploading ? "Scanning..." : "Upload file"}
        </label>
      </div>

      {uploads.length ? (
        <div className="upload-list">
          {uploads.map((upload) => (
            <article key={upload.id} className="upload-item">
              <header style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <h4 style={{ margin: 0 }}>{upload.name}</h4>
                <span className="muted">
                  {formatBytes(upload.size)} · {formatTimestamp(upload.uploadedAt)}
                </span>
              </header>
              <p className="muted" style={{ margin: 0 }}>
                {upload.preview ? `${upload.preview}…` : "Document analysed, awaiting agent feedback."}
              </p>
              <div className="upload-item__meta">
                {upload.insights.jurisdiction ? <span>Jurisdiction: {upload.insights.jurisdiction}</span> : null}
                {upload.insights.emails?.length ? (
                  <span>Contacts: {upload.insights.emails.join(", ")}</span>
                ) : null}
                {upload.insights.dates?.length ? <span>Dates: {upload.insights.dates.join(", ")}</span> : null}
              </div>
              {upload.insights.topics.length ? (
                <div className="upload-item__highlights">
                  {upload.insights.topics.map((topic) => (
                    <span key={topic} className="upload-chip">
                      {topic}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="muted" style={{ margin: 0 }}>
          No documents uploaded yet. Start with employment contracts, visa request forms, or DPIA drafts.
        </p>
      )}
    </section>
  );
};
