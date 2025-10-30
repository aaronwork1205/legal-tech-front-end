import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell.jsx";
import { useAuth } from "../state/authContext.jsx";
import { subscriptionTiers } from "../data/subscriptions.js";
import { WorkspaceSnapshot } from "../components/workspace/WorkspaceSnapshot.jsx";
import { CaseCard } from "../components/workspace/CaseCard.jsx";
import "../components/workspace/workspace.css";

const DashboardContent = ({
  user,
  currentPlan,
  onPlanChange,
  planStatus,
  caseMetrics,
  cases,
  upcomingMilestone
}) => {
  const greeting = user?.companyName ?? "LexiFlow workspace";
  const nextDeadline = upcomingMilestone
    ? `${upcomingMilestone.title} (${upcomingMilestone.displayDate})`
    : "All caught up";

  return (
    <div className="container workspace-page">
      <header className="workspace-header">
        <div className="workspace-intro">
          <h1>Welcome back, {greeting}</h1>
          <p className="muted">
            Track legal operations in one place: monitor usage, review generated paperwork, and stay ahead of the next
            compliance milestone.
          </p>
          <div className="usage-badges">
            <span className="usage-badge">{user?.verified ? "Verified workspace" : "Verification pending"}</span>
            <span className="usage-badge">{caseMetrics.activeCases} active cases</span>
            <span className="usage-badge">{caseMetrics.counselEngaged} counsel engaged</span>
            <span className="usage-badge">{caseMetrics.pendingDocuments} items awaiting review</span>
            <span className="usage-badge">{caseMetrics.aiMessages} AI messages stored</span>
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
            Next deadline: {nextDeadline}
          </p>
        </div>
      </header>

      <div className="workspace-grid">
        <WorkspaceSnapshot
          user={user}
          currentPlan={currentPlan}
          onPlanChange={onPlanChange}
          planStatus={planStatus}
          metrics={caseMetrics}
        />
        {cases.map((caseItem) => (
          <CaseCard key={caseItem.id} caseData={caseItem} />
        ))}
      </div>
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

  useEffect(() => {
    if (user?.role === "lawyer") {
      navigate("/lawyer/cases", { replace: true });
    }
  }, [user, navigate]);

  const currentPlan = useMemo(
    () => subscriptionTiers.find((plan) => plan.id === user?.subscription) ?? subscriptionTiers[0],
    [user]
  );

  const cases = useMemo(
    () => [
      {
        id: "case-ep",
        name: "Singapore Employment Pass Renewals",
        status: "Active",
        priority: "High",
        matterType: "Immigration & Employment",
        owner: "Legal Ops - Amy Chen",
        openedOn: "Jan 18, 2024",
        summary: "Renew EPs for two senior engineers relocating to Singapore.",
        aiContext: {
          focus: "Employment pass sponsorship renewal",
          lastUpdate: "Synced Feb 18 at 10:32"
        },
        aiUsage: {
          messages: 68,
          lastInteraction: "Feb 18, 10:32"
        },
        documents: [
          {
            id: "doc-ep-intake",
            name: "EP Intake Questionnaire",
            owner: "HR - Kelly Wong",
            uploadedOn: "Feb 12",
            status: "Reviewed"
          },
          {
            id: "doc-salary-history",
            name: "Salary History & Payslips",
            owner: "Finance - Leo Ortiz",
            uploadedOn: "Feb 15",
            status: "Awaiting attorney review"
          }
        ],
        personalDocuments: [
          {
            id: "doc-passport-lin",
            name: "Passport Scan – Lin Wei",
            owner: "Employee - Lin Wei",
            uploadedOn: "Feb 13",
            status: "Accepted"
          },
          {
            id: "doc-dependent-letter",
            name: "Dependent Letter Draft",
            owner: "HR - Kelly Wong",
            uploadedOn: "Feb 17",
            status: "Awaiting signature"
          }
        ],
        tasks: [
          {
            id: "task-ep-1",
            title: "Collect notarised marriage certificate",
            owner: "Employee - Lin Wei",
            due: "Feb 19",
            status: "in-progress"
          },
          {
            id: "task-ep-2",
            title: "Confirm MOM appointment availability",
            owner: "LexiFlow Assistant",
            due: "Feb 20",
            status: "planned"
          }
        ],
        timeline: [
          {
            id: "timeline-ep-1",
            date: "2024-02-12",
            displayDate: "Feb 12",
            title: "Case opened",
            description: "LexiFlow logged the renewal scope and assigned a Legal Ops owner.",
            type: "milestone"
          },
          {
            id: "timeline-ep-2",
            date: "2024-02-15",
            displayDate: "Feb 15",
            title: "Finance uploaded salary history",
            description: "Used to confirm EP minimum qualifying salary.",
            type: "upload"
          },
          {
            id: "timeline-ep-3",
            date: "2024-02-22",
            displayDate: "Feb 22",
            title: "Attorney review deadline",
            description: "Sophia to confirm completeness before MOM submission.",
            type: "deadline"
          }
        ],
        attorneys: [
          {
            id: "attorney-tan",
            name: "Sophia Tan",
            firm: "Atlas Immigration",
            focus: "Singapore EP renewals",
            availability: "Review slot held for Feb 21",
            reason: "Completed 12 MOM submissions in Q4"
          },
          {
            id: "attorney-ng",
            name: "Taylor Ng",
            firm: "Ng & Partners",
            focus: "APAC employment compliance",
            availability: "Initial consult available within 24h",
            reason: "Supports payroll entries across SG & HK"
          }
        ]
      },
      {
        id: "case-hq",
        name: "Bay Area HQ Lease & Fit-out",
        status: "Active",
        priority: "Medium",
        matterType: "Commercial Real Estate",
        owner: "Real Estate - Marco Ruiz",
        openedOn: "Dec 2, 2023",
        summary: "Negotiating the HQ lease amendment and coordinating environmental diligence.",
        aiContext: {
          focus: "Lease amendment and environmental diligence",
          lastUpdate: "Synced Feb 17 at 16:20"
        },
        aiUsage: {
          messages: 54,
          lastInteraction: "Feb 17, 16:20"
        },
        documents: [
          {
            id: "doc-lease-redlines",
            name: "Lease Amendment Redlines",
            owner: "Legal Ops - Amy Chen",
            uploadedOn: "Feb 14",
            status: "Awaiting attorney review"
          },
          {
            id: "doc-esa-report",
            name: "Phase I ESA Report",
            owner: "Facilities - Priya Das",
            uploadedOn: "Feb 11",
            status: "Attorney comments shared"
          }
        ],
        personalDocuments: [
          {
            id: "doc-insurance",
            name: "Insurance Certificate",
            owner: "Facilities - Priya Das",
            uploadedOn: "Feb 10",
            status: "Accepted"
          }
        ],
        tasks: [
          {
            id: "task-hq-1",
            title: "Send landlord updated capex appendix",
            owner: "Real Estate - Marco Ruiz",
            due: "Feb 18",
            status: "in-progress"
          },
          {
            id: "task-hq-2",
            title: "Upload contractor safety plans",
            owner: "Facilities - Priya Das",
            due: "Feb 22",
            status: "planned"
          }
        ],
        timeline: [
          {
            id: "timeline-hq-1",
            date: "2024-02-10",
            displayDate: "Feb 10",
            title: "Environmental survey scheduled",
            description: "Vendors booked for a Mar 5 on-site review.",
            type: "milestone"
          },
          {
            id: "timeline-hq-2",
            date: "2024-02-19",
            displayDate: "Feb 19",
            title: "Landlord response expected",
            description: "Awaiting feedback on capex sharing clause.",
            type: "deadline"
          },
          {
            id: "timeline-hq-3",
            date: "2024-03-05",
            displayDate: "Mar 5",
            title: "Phase I ESA site visit",
            description: "Ensure facilities team attends the walkthrough.",
            type: "milestone"
          }
        ],
        attorneys: [
          {
            id: "attorney-liu",
            name: "Evelyn Liu",
            firm: "Harbor & Co.",
            focus: "Commercial real estate",
            availability: "Office hours support within 48h",
            reason: "Negotiated prior Bay Area leases"
          },
          {
            id: "attorney-evans",
            name: "Jordan Evans",
            firm: "Coastal Environmental Law",
            focus: "Environmental compliance",
            availability: "Virtual consult open Feb 20",
            reason: "Guided 15 tech HQ assessments"
          }
        ]
      }
    ],
    []
  );

  const caseMetrics = useMemo(() => {
    const totalCases = cases.length;
    const activeCases = cases.filter((item) => item.status === "Active").length;
    const counselEngaged = cases.reduce((sum, item) => sum + (item.attorneys?.length ?? 0), 0);
    const pendingDocuments = cases.reduce((sum, item) => {
      const docs = [...(item.documents ?? []), ...(item.personalDocuments ?? [])];
      return (
        sum +
        docs.filter((doc) => String(doc.status ?? "").toLowerCase().includes("await")).length
      );
    }, 0);
    const aiMessages = cases.reduce((sum, item) => sum + (item.aiUsage?.messages ?? 0), 0);
    return { totalCases, activeCases, counselEngaged, pendingDocuments, aiMessages };
  }, [cases]);

  const upcomingMilestone = useMemo(() => {
    const events = cases.flatMap((caseItem) =>
      (caseItem.timeline ?? []).map((event) => ({
        caseId: caseItem.id,
        caseName: caseItem.name,
        ...event
      }))
    );
    if (!events.length) {
      return null;
    }
    const sorted = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));
    const now = new Date();
    return sorted.find((event) => new Date(event.date) >= now) ?? sorted[sorted.length - 1];
  }, [cases]);

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
      <DashboardContent
        user={user}
        currentPlan={currentPlan}
        onPlanChange={handlePlanSelect}
        planStatus={planStatus}
        caseMetrics={caseMetrics}
        cases={cases}
        upcomingMilestone={upcomingMilestone}
      />
    </AppShell>
  );
};

export default Dashboard;
