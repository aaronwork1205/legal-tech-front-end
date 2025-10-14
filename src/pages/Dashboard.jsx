import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell.jsx";
import { Hero } from "../components/dashboard/Hero.jsx";
import { AssistantConsole } from "../components/dashboard/AssistantConsole.jsx";
import { PlanSelector } from "../components/dashboard/PlanSelector.jsx";
import { Testimonials } from "../components/dashboard/Testimonials.jsx";
import { AssistantProvider } from "../state/assistantContext.jsx";
import { useAuth } from "../state/authContext.jsx";
import { subscriptionTiers } from "../data/subscriptions.js";
import "../components/dashboard/dashboard.css";

const Dashboard = () => {
  const { user, isAuthenticated, changePlan, status } = useAuth();
  const navigate = useNavigate();
  const [planStatus, setPlanStatus] = useState({ loading: false, message: "" });

  useEffect(() => {
    if (!isAuthenticated && status !== "loading") {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, status, navigate]);

  const currentPlan = useMemo(
    () => subscriptionTiers.find((plan) => plan.id === user?.subscription) ?? subscriptionTiers[0],
    [user]
  );

  const needsVerification = Boolean(user) && !user.verified;

  const handlePlanSelect = async (planId) => {
    if (!user || planId === user.subscription) return;
    setPlanStatus({ loading: true, message: "" });
    try {
      await changePlan(planId);
      setPlanStatus({ loading: false, message: "Plan updated successfully." });
    } catch (error) {
      setPlanStatus({ loading: false, message: error.message });
    }
  };

  return (
    <AppShell>
      <div className="page">
        <Hero subscription={currentPlan} verified={Boolean(user?.verified)} />
        {needsVerification ? (
          <div className="container surface" style={{ marginBottom: "2rem" }}>
            <h3>Action required: verify your workspace</h3>
            <p className="muted">
              We still need you to confirm the code we sent to <strong>{user.email}</strong>. Verifying enables exports,
              attorney calls, and knowledge base sync.
            </p>
            <button className="btn btn-secondary" onClick={() => navigate("/verify-email")}>
              Go to verification
            </button>
          </div>
        ) : null}
        <AssistantProvider>
          <AssistantConsole />
        </AssistantProvider>
        <PlanSelector activePlan={user?.subscription} onSelect={handlePlanSelect} />
        {planStatus.message ? (
          <p className="container muted" style={{ marginTop: "0.5rem" }}>
            {planStatus.message}
          </p>
        ) : null}
        <Testimonials />
      </div>
    </AppShell>
  );
};

export default Dashboard;
