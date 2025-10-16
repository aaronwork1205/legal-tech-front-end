import { useEffect, useMemo } from "react";
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

const AssistantWorkspaceContent = ({ user }) => {
  const { summary, usage, cases, createCase, activeCase, setActiveCase } = useAssistant();
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

  const handleNewCase = (payload) => {
    const created = createCase(payload);
    setActiveCase(created.id);
  };

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

      <section className="workspace-card workspace-card--full case-create-section">
        <header className="case-section__header">
          <div>
            <h3>Create a new case</h3>
            <p className="muted">Capture stakeholders, documents, and milestones before handing off to LexiFlow.</p>
          </div>
        </header>
        <CaseCreationForm onSubmit={handleNewCase} showCancel={false} showHeader={false} />
      </section>

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
            No cases yet. Submit the form above to create your first matter.
          </p>
        )}
      </section>
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
