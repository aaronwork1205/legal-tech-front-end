import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell.jsx";
import { AssistantProvider, useAssistant } from "../state/assistantContext.jsx";
import { useAuth } from "../state/authContext.jsx";
import { subscriptionTiers } from "../data/subscriptions.js";
import { WorkspaceSnapshot } from "../components/workspace/WorkspaceSnapshot.jsx";
import { DocumentIntake } from "../components/workspace/DocumentIntake.jsx";
import { PaperworkPanel } from "../components/workspace/PaperworkPanel.jsx";
import { AttorneySpotlight } from "../components/workspace/AttorneySpotlight.jsx";
import { AgentChat } from "../components/workspace/AgentChat.jsx";
import "../components/workspace/workspace.css";

const DashboardContent = ({ user, currentPlan, onPlanChange, planStatus }) => {
  const { usage, summary } = useAssistant();
  const greeting = user?.companyName ?? "LexiFlow workspace";

  return (
    <div className="container workspace-page">
      <header className="workspace-header">
        <div className="workspace-intro">
          <h1>Welcome back, {greeting}</h1>
          <p className="muted">
            Track legal operations in one place: monitor usage, review generated paperwork, and continue the
            conversation with LexiFlow&apos;s agentic assistant.
          </p>
          <div className="usage-badges">
            <span className="usage-badge">{user?.verified ? "Verified workspace" : "Verification pending"}</span>
            <span className="usage-badge">Current risk: {summary.risk}</span>
          </div>
        </div>
        <div className="workspace-plan">
          <span className="muted">Subscription snapshot</span>
          <strong>{currentPlan.name}</strong>
          <span className="muted">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: currentPlan.currency }).format(
              currentPlan.price
            )}{" "}
            / {currentPlan.cadence}
          </span>
          <p className="muted" style={{ margin: 0 }}>
            Next steps: {summary.nextSteps[0]}
          </p>
        </div>
      </header>

      <div className="workspace-grid">
        <WorkspaceSnapshot
          user={user}
          currentPlan={currentPlan}
          usage={usage}
          onPlanChange={onPlanChange}
          planStatus={planStatus}
        />
        <DocumentIntake />
        <PaperworkPanel />
        <AttorneySpotlight />
      </div>

      <AgentChat />
    </div>
  );
};

const Dashboard = () => {
  const { user, isAuthenticated, changePlan, status } = useAuth();
  const navigate = useNavigate();
  const [planStatus, setPlanStatus] = useState("");

  useEffect(() => {
    if (!isAuthenticated && status !== "loading") {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, status, navigate]);

  const currentPlan = useMemo(
    () => subscriptionTiers.find((plan) => plan.id === user?.subscription) ?? subscriptionTiers[0],
    [user]
  );

  const handlePlanSelect = async (planId) => {
    if (!user || planId === user.subscription) return;
    const planName = subscriptionTiers.find((tier) => tier.id === planId)?.name ?? planId;
    setPlanStatus("Switching plan...");
    try {
      await changePlan(planId);
      setPlanStatus(`Plan updated to ${planName}.`);
    } catch (error) {
      setPlanStatus(error.message);
    }
  };

  return (
    <AppShell>
      <AssistantProvider>
        <DashboardContent
          user={user}
          currentPlan={currentPlan}
          onPlanChange={handlePlanSelect}
          planStatus={planStatus}
        />
      </AssistantProvider>
    </AppShell>
  );
};

export default Dashboard;
