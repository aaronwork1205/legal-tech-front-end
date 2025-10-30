import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell.jsx";
import { useAuth } from "../state/authContext.jsx";
import { getCase, listCases } from "../services/caseService.js";
import "../components/workspace/workspace.css";

const formatDate = (value) => {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const emptyState = (
  <div className="case-manager__empty">
    <h3>No matters assigned yet</h3>
    <p className="muted">When a client assigns a case to you, it will show up here with documents and status.</p>
  </div>
);

const LawyerCasesContent = ({
  cases,
  activeCaseId,
  onSelectCase,
  onRefreshCase,
  isRefreshing,
  currentLawyerId
}) => {
  const activeCase = useMemo(() => cases.find((item) => item.id === activeCaseId) ?? null, [cases, activeCaseId]);

  const groupedDocuments = useMemo(() => {
    if (!activeCase?.documents?.length) return [];
    const groups = activeCase.documents.reduce((acc, doc) => {
      const key = doc.category ?? "general";
      if (!acc[key]) acc[key] = [];
      acc[key].push(doc);
      return acc;
    }, {});

    return Object.entries(groups).map(([category, docs]) => ({
      category,
      title:
        category === "personal"
          ? "Client personal documents"
          : category === "case"
          ? "Case documents"
          : category === "private"
          ? "Lawyer-only files"
          : `Category: ${category}`,
      documents: docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }));
  }, [activeCase]);

  const assignmentInfo = useMemo(() => {
    if (!activeCase?.assignedLawyers?.length) return null;
    if (currentLawyerId) {
      const match = activeCase.assignedLawyers.find((item) => item.id === currentLawyerId);
      if (match) return match;
    }
    return activeCase.assignedLawyers[0];
  }, [activeCase, currentLawyerId]);

  const metadataEntries = useMemo(() => {
    if (!activeCase?.metadata) return [];
    return Object.entries(activeCase.metadata).map(([key, value]) => ({
      key,
      value: typeof value === "string" ? value : JSON.stringify(value, null, 2)
    }));
  }, [activeCase]);

  return (
    <section className="workspace-card workspace-card--full case-manager">
      <header className="case-section__header">
        <div>
          <h3>Matters assigned to you</h3>
          <p className="muted">
            Pick a case on the left to review client context, uploads, and AI insights before you reach out.
          </p>
        </div>
        <div className="case-manager__actions">
          <span className="pill">
            {cases.length} {cases.length === 1 ? "matter" : "matters"}
          </span>
          <button type="button" className="btn btn-secondary" onClick={onRefreshCase} disabled={!activeCase || isRefreshing}>
            {isRefreshing ? "Refreshing..." : "Refresh case"}
          </button>
        </div>
      </header>

      {!cases.length ? (
        emptyState
      ) : (
        <div className="case-manager__body">
          <aside className="case-manager__list">
            {cases.map((caseItem) => {
              const isActive = caseItem.id === activeCase?.id;
              return (
                <button
                  key={caseItem.id}
                  type="button"
                  className={`case-manager__list-item${isActive ? " case-manager__list-item--active" : ""}`}
                  onClick={() => onSelectCase(caseItem.id)}
                >
                  <span className="case-manager__list-title">{caseItem.name}</span>
                  <span className="case-manager__list-meta">
                    {caseItem.client?.companyName ?? "Unnamed client"} · {caseItem.status ?? "Pending"}
                  </span>
                </button>
              );
            })}
          </aside>

          {activeCase ? (
            <div className="case-manager__details">
              <header className="case-detail__header">
                <div>
                  <h2>{activeCase.name}</h2>
                  <p className="muted">{activeCase.summary || "No additional client summary yet."}</p>
                </div>
                <dl className="case-detail__meta">
                  <div>
                    <dt>Priority</dt>
                    <dd>{activeCase.priority ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{activeCase.status ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Last updated</dt>
                    <dd>{formatDate(activeCase.updatedAt)}</dd>
                  </div>
                </dl>
              </header>

              <section className="case-detail__section">
                <h4>Client details</h4>
                <div className="case-detail__grid">
                  <div>
                    <span className="muted">Client name</span>
                    <p>{activeCase.client?.companyName ?? "Not provided"}</p>
                  </div>
                  <div>
                    <span className="muted">Contact email</span>
                    <p>{activeCase.client?.email ?? "Not provided"}</p>
                  </div>
                  <div>
                    <span className="muted">Assigned at</span>
                    <p>{assignmentInfo ? formatDate(assignmentInfo.assignedAt) : "—"}</p>
                  </div>
                  <div>
                    <span className="muted">Case owner</span>
                    <p>{activeCase.owner || "Unassigned"}</p>
                  </div>
                </div>
                {activeCase.assignedLawyers?.length ? (
                  <div className="case-detail__notes">
                    <span className="muted">Team notes</span>
                    <ul>
                      {activeCase.assignedLawyers.map((lawyer) => (
                        <li key={lawyer.id}>
                          {lawyer.companyName} ({lawyer.email}){lawyer.notes ? `: ${lawyer.notes}` : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>

              <section className="case-detail__section">
                <h4>Documents & files</h4>
                {groupedDocuments.length ? (
                  groupedDocuments.map((group) => (
                    <Fragment key={group.category}>
                      <h5 style={{ marginBottom: "0.4rem" }}>{group.title}</h5>
                      <ul className="document-list">
                        {group.documents.map((document) => (
                          <li key={document.id} className="document-list__item">
                            <div>
                              <p className="document-title">{document.name}</p>
                              <p className="muted">
                                {document.owner ? `${document.owner} · ` : ""}
                                {document.status ?? "Unspecified status"}
                              </p>
                            </div>
                            <div className="document-meta">
                              <span className="muted">{formatDate(document.createdAt)}</span>
                              {document.storagePath ? (
                                <a href={document.storagePath} className="link" target="_blank" rel="noreferrer">
                                  Open
                                </a>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </Fragment>
                  ))
                ) : (
                  <p className="muted">No documents uploaded yet.</p>
                )}
              </section>

              {activeCase.aiContext ? (
                <section className="case-detail__section">
                  <h4>AI highlights</h4>
                  <pre className="code-block">{JSON.stringify(activeCase.aiContext, null, 2)}</pre>
                </section>
              ) : null}

              {metadataEntries.length ? (
                <section className="case-detail__section">
                  <h4>Additional details</h4>
                  <div className="metadata-grid">
                    {metadataEntries.map((item) => (
                      <div key={item.key} className="metadata-card">
                        <span className="muted">{item.key}</span>
                        <pre className="code-block">{item.value}</pre>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <div className="case-manager__placeholder">
              <p className="muted">Select a matter to load its details.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

const LawyerCasesPage = () => {
  const { user, isAuthenticated, status } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === "loading" || !isAuthenticated) return;
    if (user?.role !== "lawyer") {
      navigate(user ? "/dashboard" : "/login", { replace: true });
    }
  }, [isAuthenticated, status, user, navigate]);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listCases();
      setCases(data);
      if (data.length) {
        setActiveCaseId((current) => current ?? data[0].id);
      } else {
        setActiveCaseId(null);
      }
    } catch (err) {
      setError(err.message ?? "Unable to fetch matters");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "lawyer") {
      fetchCases();
    }
  }, [user, fetchCases]);

  const handleRefreshCase = useCallback(async () => {
    if (!activeCaseId) return;
    setRefreshing(true);
    setError("");
    try {
      const caseData = await getCase(activeCaseId);
      if (!caseData) return;
      setCases((prev) => {
        const exists = prev.some((item) => item.id === caseData.id);
        if (exists) {
          return prev.map((item) => (item.id === caseData.id ? caseData : item));
        }
        return [caseData, ...prev];
      });
    } catch (err) {
      setError(err.message ?? "Failed to refresh matter");
    } finally {
      setRefreshing(false);
    }
  }, [activeCaseId]);

  return (
    <AppShell>
      <div className="container workspace-page">
        <header className="workspace-header">
          <div className="workspace-intro">
            <h1>Lawyer workspace</h1>
            <p className="muted">Review every matter assigned to you, including client documents and AI-generated context.</p>
            <div className="usage-badges">
              <span className="usage-badge">Workspace: {user?.companyName ?? user?.email}</span>
              <span className="usage-badge">Matters: {cases.length}</span>
            </div>
          </div>
          <div className="workspace-plan">
            <span className="muted">Last synced</span>
            <strong>{formatDate(new Date())}</strong>
            <p className="muted" style={{ margin: 0 }}>
              Keep this tab open to stay in sync with client uploads.
            </p>
          </div>
        </header>

        {error ? <div className="alert alert-error">{error}</div> : null}

        {loading ? (
          <div className="workspace-card workspace-card--full">
            <p className="muted">Loading matters...</p>
          </div>
        ) : (
          <LawyerCasesContent
            cases={cases}
            activeCaseId={activeCaseId}
            onSelectCase={setActiveCaseId}
            onRefreshCase={handleRefreshCase}
            isRefreshing={refreshing}
            currentLawyerId={user?.id}
          />
        )}
      </div>
    </AppShell>
  );
};

export default LawyerCasesPage;
