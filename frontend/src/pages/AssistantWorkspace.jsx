import { Fragment, useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/layout/AppShell.jsx";
import { AssistantProvider, useAssistant } from "../state/assistantContext.jsx";
import { useAuth } from "../state/authContext.jsx";
import { CaseCreationForm } from "../components/workspace/CaseCreationForm.jsx";
import "../components/workspace/workspace.css";

const CaseSection = ({ title, items = [], renderItem, emptyText }) => (
  <div className="case-manager__section">
    <h5>{title}</h5>
    {items.length ? (
      <ul className="case-manager__items">
        {items.map((item) => (
          <li key={item.id ?? item.title ?? item.name} className="case-manager__item">
            {renderItem(item)}
          </li>
        ))}
      </ul>
    ) : (
      <p className="muted">{emptyText}</p>
    )}
  </div>
);

const CaseCreatedModal = ({ caseData, onClose }) => {
  if (!caseData) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="case-created-title">
      <div className="modal-card">
        <header className="modal-card__header">
          <h3 id="case-created-title">Case created</h3>
          <button type="button" className="link" onClick={onClose}>
            Close
          </button>
        </header>
        <p className="muted" style={{ marginTop: 0 }}>
          {caseData.name} is now ready. Stakeholders can upload supporting documents, chat with the assistant, and
          review tailored paperwork from this workspace.
        </p>
        <dl className="modal-card__summary">
          <div>
            <dt>Owner</dt>
            <dd>{caseData.owner ?? "Unassigned"}</dd>
          </div>
          <div>
            <dt>Priority</dt>
            <dd>{caseData.priority ?? "Medium"}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{caseData.status ?? "Active"}</dd>
          </div>
        </dl>
        <footer className="modal-card__footer">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Go to case
          </button>
        </footer>
      </div>
    </div>
  );
};

const AssistantWorkspaceContent = ({ user }) => {
  const {
    summary,
    usage,
    cases,
    createCase,
    activeCase,
    setActiveCase,
    uploadDocument,
    uploading,
    paperwork,
    paperworkLog,
    messages,
    sendMessage,
    processing,
    error
  } = useAssistant();
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [newlyCreatedCase, setNewlyCreatedCase] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const userLabel = user?.companyName ?? user?.email ?? "your team";
  const hasCases = cases.length > 0;
  const hasActiveCase = Boolean(activeCase);
  const nextStep = summary.nextSteps?.[0] ?? "Share your scenario";

  const sortedCases = useMemo(() => cases, [cases]);

  useEffect(() => {
    if (!activeCase && cases.length) {
      setActiveCase(cases[0].id);
    }
  }, [activeCase, cases, setActiveCase]);

  const startCaseCreation = () => setIsCreatingCase(true);
  const cancelCaseCreation = () => setIsCreatingCase(false);
  const closeCaseCreatedModal = () => setNewlyCreatedCase(null);

  const handleNewCase = (payload) => {
    const created = createCase(payload);
    setActiveCase(created.id);
    setIsCreatingCase(false);
    setNewlyCreatedCase(created);
    return created;
  };

  const handleChatSubmit = (event) => {
    event.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput("");
  };

  const handleDocumentUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadDocument(file);
    event.target.value = "";
  };

  const recentPaperwork = paperwork ?? paperworkLog?.[0] ?? null;

  const stakeholders = activeCase?.stakeholders ?? [];
  const caseDocuments = activeCase?.documents ?? [];
  const personalDocuments = activeCase?.personalDocuments ?? [];
  const timeline = activeCase?.timeline ?? [];
  const tasks = activeCase?.tasks ?? [];

  return (
    <div className="container workspace-page">
      <header className="workspace-header">
        <div className="workspace-intro">
          <h1>AI workspace</h1>
          <p className="muted">
            Combine document automation, conversations, and attorney escalation in a single guided experience.
          </p>
          <div className="usage-badges">
            <span className="usage-badge">Workspace: {userLabel}</span>
            <span className="usage-badge">Messages: {usage.messages}</span>
            <span className="usage-badge">Documents: {usage.documents}</span>
            <span className="usage-badge">Cases: {cases.length}</span>
          </div>
        </div>
      </header>

      {isCreatingCase ? (
        <CaseCreationForm onSubmit={handleNewCase} onCancel={cancelCaseCreation} />
      ) : (
        <section className="workspace-card workspace-card--full case-create-section">
          <header className="case-section__header">
            <div>
              <h3>Create a new case</h3>
              <p className="muted">Capture stakeholders, documents, and milestones before handing off to LexiFlow.</p>
            </div>
            <button type="button" className="btn btn-primary" onClick={startCaseCreation}>
              Create new case
            </button>
          </header>
          <p className="muted" style={{ margin: 0 }}>
            Launch a workspace for your matter when you are ready to organise stakeholders, files, and timelines.
          </p>
        </section>
      )}

      <section className="workspace-card workspace-card--full case-manager">
        <header className="case-section__header">
          <div>
            <h3>Manage existing cases</h3>
            <p className="muted">
              {hasCases
                ? "Select a case to review stakeholders, files, and milestones in one place."
                : "New cases will appear here once created."}
            </p>
          </div>
          <span className="pill">
            {cases.length} case{cases.length === 1 ? "" : "s"}
          </span>
        </header>

        {hasCases ? (
          <div className="case-manager__body">
            <aside className="case-manager__list">
              {sortedCases.map((caseItem) => {
                const isActive = activeCase?.id === caseItem.id;
                return (
                  <button
                    key={caseItem.id}
                    type="button"
                    className={`case-manager__list-item${isActive ? " case-manager__list-item--active" : ""}`}
                    onClick={() => setActiveCase(caseItem.id)}
                  >
                    <span className="case-manager__list-title">{caseItem.name}</span>
                    <span className="case-manager__list-meta">
                      {caseItem.status ?? "Active"} · {caseItem.owner ?? "Unassigned"}
                    </span>
                  </button>
                );
              })}
            </aside>

            <div className="case-manager__workspace">
              {hasActiveCase ? (
                <div className="case-manager__content">
                  <header className="case-manager__content-header">
                    <h4>{activeCase.name}</h4>
                    <p className="muted">
                      Owner: {activeCase.owner ?? "Unassigned"} · Priority: {activeCase.priority ?? "Medium"}
                    </p>
                    <p className="muted" style={{ marginBottom: "1rem" }}>
                      Next step: {nextStep}
                    </p>
                  </header>
                  <div className="case-manager__grid">
                    <CaseSection
                      title="Stakeholders"
                      items={stakeholders}
                      emptyText="No stakeholders captured yet."
                      renderItem={(item) => (
                        <>
                          <strong>{item.name}</strong>
                          <span>{item.role ?? "Role not specified"}</span>
                          {item.email ? <small>{item.email}</small> : null}
                        </>
                      )}
                    />
                    <CaseSection
                      title="Case documents"
                      items={caseDocuments}
                      emptyText="No case documents yet."
                      renderItem={(doc) => (
                        <>
                          <strong>{doc.name}</strong>
                          <span>{doc.owner ?? "Unknown owner"}</span>
                          {doc.description ? <small>{doc.description}</small> : null}
                        </>
                      )}
                    />
                    <CaseSection
                      title="Personal documents"
                      items={personalDocuments}
                      emptyText="No personal documents yet."
                      renderItem={(doc) => (
                        <>
                          <strong>{doc.name}</strong>
                          <span>{doc.owner ?? "Unknown owner"}</span>
                          {doc.description ? <small>{doc.description}</small> : null}
                        </>
                      )}
                    />
                    <CaseSection
                      title="Timeline"
                      items={timeline}
                      emptyText="No timeline entries yet."
                      renderItem={(event) => (
                        <>
                          <strong>{event.title}</strong>
                          <span>{event.displayDate ?? event.date ?? ""} · {event.type ?? "milestone"}</span>
                          {event.description ? <small>{event.description}</small> : null}
                        </>
                      )}
                    />
                    <CaseSection
                      title="Action items"
                      items={tasks}
                      emptyText="No action items yet."
                      renderItem={(task) => (
                        <>
                          <strong>{task.title}</strong>
                          <span>{task.owner ?? "Unassigned"} · Due {task.due ?? "TBD"}</span>
                          <small>Status: {task.status ?? "planned"}</small>
                        </>
                      )}
                    />
                  </div>
                  <div className="case-manager__support">
                    <section className="case-support-card">
                      <header>
                        <h5>Upload documents</h5>
                        <p className="muted">Share context with the assistant and attorneys.</p>
                      </header>
                      <label className="upload-dropzone">
                        <input type="file" onChange={handleDocumentUpload} disabled={uploading} />
                        <span>{uploading ? "Processing upload..." : "Click or drop files to add them"}</span>
                      </label>
                      {error ? <p className="error-text">{error}</p> : null}
                    </section>
                    <section className="case-support-card">
                      <header>
                        <h5>AI conversation</h5>
                        <p className="muted">Ask for next steps or summaries and keep the case thread alive.</p>
                      </header>
                      <div className="case-chat">
                        <div className="case-chat__messages">
                          {messages.slice(-5).map((message) => (
                            <article
                              key={message.id}
                              className={`case-chat__message case-chat__message--${message.role}`}
                            >
                              <header>
                                <strong>{message.role === "assistant" ? "LexiFlow" : "You"}</strong>
                                <span className="muted">{message.createdAt ?? ""}</span>
                              </header>
                              <p>{message.content}</p>
                            </article>
                          ))}
                        </div>
                        <form className="case-chat__composer" onSubmit={handleChatSubmit}>
                          <input
                            className="input"
                            type="text"
                            value={chatInput}
                            onChange={(event) => setChatInput(event.target.value)}
                            placeholder="Ask for next steps or request a summary..."
                            disabled={processing}
                          />
                          <button className="btn btn-primary" type="submit" disabled={processing || !chatInput.trim()}>
                            {processing ? "Sending..." : "Send"}
                          </button>
                        </form>
                      </div>
                    </section>
                    <section className="case-support-card">
                      <header>
                        <h5>Recommended paperwork</h5>
                        <p className="muted">Latest drafts tailored to this workspace.</p>
                      </header>
                      {recentPaperwork ? (
                        <Fragment>
                          <div className="paperwork-preview">
                            <strong>{recentPaperwork.title}</strong>
                            <p className="muted">
                              {recentPaperwork.description ?? "Preview generated by the assistant."}
                            </p>
                          </div>
                          <ul className="paperwork-checklist">
                            {(recentPaperwork.checklist ?? []).slice(0, 3).map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                          <p className="muted">
                            Generated{" "}
                            {recentPaperwork.generatedAt
                              ? new Date(recentPaperwork.generatedAt).toLocaleString()
                              : "recently"}
                          </p>
                        </Fragment>
                      ) : (
                        <p className="muted" style={{ margin: 0 }}>
                          No paperwork yet. Upload documents or chat with the assistant to draft templates.
                        </p>
                      )}
                    </section>
                  </div>
                </div>
              ) : (
                <p className="muted" style={{ margin: 0 }}>
                  Select a case from the list to explore its details.
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            No cases yet. Click &ldquo;Create new case&rdquo; above when you are ready to start your first matter.
          </p>
        )}
      </section>
      <CaseCreatedModal caseData={newlyCreatedCase} onClose={closeCaseCreatedModal} />
    </div>
  );
};

const AssistantWorkspace = () => {
  const { user } = useAuth();

  return (
    <AppShell>
      <AssistantProvider>
        <AssistantWorkspaceContent user={user} />
      </AssistantProvider>
    </AppShell>
  );
};

export default AssistantWorkspace;
