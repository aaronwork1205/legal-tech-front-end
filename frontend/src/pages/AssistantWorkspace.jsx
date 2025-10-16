import { AppShell } from "../components/layout/AppShell.jsx";
import { AssistantProvider, useAssistant } from "../state/assistantContext.jsx";
import { useAuth } from "../state/authContext.jsx";
import { DocumentIntake } from "../components/workspace/DocumentIntake.jsx";
import { PaperworkPanel } from "../components/workspace/PaperworkPanel.jsx";
import { AttorneySpotlight } from "../components/workspace/AttorneySpotlight.jsx";
import { AgentChat } from "../components/workspace/AgentChat.jsx";
import "../components/workspace/workspace.css";

const AssistantWorkspaceContent = ({ user }) => {
  const { summary, usage } = useAssistant();
  const userLabel = user?.companyName ?? user?.email ?? "your team";

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
          </div>
        </div>
        <div className="workspace-plan">
          <span className="muted">Current focus</span>
          <strong>{summary.risk}</strong>
          <p className="muted" style={{ margin: 0 }}>
            Next step: {summary.nextSteps[0]}
          </p>
        </div>
      </header>

      <div className="workspace-grid">
        <DocumentIntake />
        <PaperworkPanel />
        <AttorneySpotlight />
      </div>

      <AgentChat />
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
