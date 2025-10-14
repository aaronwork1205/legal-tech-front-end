import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell.jsx";
import "../components/demo/demo.css";

const scenarios = [
  {
    id: "immigration",
    title: "Immigration pack · Singapore Employment Pass",
    intake:
      "Relocate two senior engineers from Toronto to Singapore. Need Employment Pass paperwork, dependant pass for spouse, and proof of salary.",
    documents: [
      { name: "Form 8 (EP Application)", details: "Auto-filled with employee history & salary benchmarks." },
      { name: "Dependant Pass Checklist", details: "Spouse documentation & notarised marriage certificate summary." },
      { name: "Employer Compliance Brief", details: "Latest MOM regulations, salary thresholds, and levy reminders." }
    ],
    lawyerFocus: "Cross-border immigration · APAC compliance",
    regulatory: ["Ministry of Manpower", "MOM EP Portal", "Consulate notarisation"]
  },
  {
    id: "tax",
    title: "Tax filing · Remote team expansion",
    intake:
      "We opened a Delaware entity with remote staff in Germany and Japan. Need tax registration, payroll setup, and bilateral treaty paperwork.",
    documents: [
      { name: "IRS Form SS-4 Draft", details: "Employer identification updates and responsible party change." },
      { name: "Germany A1 Certificate Request", details: "Cross-border social security coverage analysis." },
      { name: "Japan NTA Registration Brief", details: "Consumption tax obligations and bilingual summary." }
    ],
    lawyerFocus: "International tax · Remote employment",
    regulatory: ["IRS", "Bundeszentralamt für Steuern", "Japan NTA"]
  },
  {
    id: "property",
    title: "Property acquisition · Bay Area HQ",
    intake:
      "Acquiring a mixed-use building in San Jose. Need zoning diligence, environmental review, and draft purchase agreement ready for investor sign-off.",
    documents: [
      { name: "Zoning Compliance Report", details: "City of San Jose ordinances auto-parsed with variance notes." },
      { name: "Phase I ESA Checklist", details: "EPA references, required inspections, and vendor shortlist." },
      { name: "Purchase Agreement Draft", details: "Pre-filled with corporate structure, financing, and escrow timelines." }
    ],
    lawyerFocus: "Commercial real estate · Environmental",
    regulatory: ["City of San Jose", "EPA Brownfields", "County Recorder"]
  }
];

const lawyerBench = [
  {
    id: "st",
    name: "Sophia Tan",
    specialty: "Immigration & Global Mobility",
    rating: 4.9,
    availability: "Calls open · Responds in 1h",
    contact: {
      chat: "Start quick chat",
      email: "sophia.tan@lexiflowlaw.com",
      phone: "+65 6123 4455"
    }
  },
  {
    id: "mr",
    name: "Marcus Roth",
    specialty: "International Tax Strategy",
    rating: 4.8,
    availability: "Next slot 14:00 UTC",
    contact: {
      chat: "Schedule 15 min",
      email: "marcus.roth@lexiflowlaw.com",
      phone: "+49 30 1234 9876"
    }
  },
  {
    id: "el",
    name: "Evelyn Liu",
    specialty: "Commercial Real Estate",
    rating: 4.7,
    availability: "On-call · Replies within 2h",
    contact: {
      chat: "Instant message",
      email: "evelyn.liu@lexiflowlaw.com",
      phone: "+1 (415) 555-2810"
    }
  }
];

const integrations = [
  "MOM / USCIS portals",
  "IRS & HMRC APIs",
  "County recorder feeds",
  "eSignature suites",
  "Google Drive & SharePoint",
  "DocuGen AI Templates"
];

const pipeline = [
  { stage: "Intake triage", metric: "2.1 min", progress: 65 },
  { stage: "Document drafting", metric: "Auto-generated", progress: 90 },
  { stage: "Data enrichment", metric: "Web & API fetch", progress: 75 },
  { stage: "Attorney review", metric: "Specialist matched", progress: 55 }
];

const DemoShowcase = () => {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [activeStep, setActiveStep] = useState(0);

  const scenario = scenarios[scenarioIndex];

  useEffect(() => {
    let char = 0;
    setTypedText("");
    const interval = setInterval(() => {
      setTypedText((prev) => prev + scenario.intake.charAt(char));
      char += 1;
      if (char >= scenario.intake.length) {
        clearInterval(interval);
      }
    }, 28);

    return () => clearInterval(interval);
  }, [scenarioIndex, scenario.intake]);

  useEffect(() => {
    const cycle = setInterval(() => {
      setScenarioIndex((prev) => (prev + 1) % scenarios.length);
    }, 10000);
    return () => clearInterval(cycle);
  }, []);

  const agentSteps = useMemo(
    () => [
      {
        id: "classify",
        title: "Classify intake & entities",
        description: `Understands this request as ${scenario.title.toLowerCase()} and extracts people, jurisdictions, and deadlines from the intake.`
      },
      {
        id: "regulations",
        title: "Scan regulations & templates",
        description: `Fetches guidance from ${scenario.regulatory.join(", ")}; maps clauses into our template library.`
      },
      {
        id: "paperwork",
        title: "Assemble paperwork bundle",
        description: `Auto-fills ${scenario.documents.map((doc) => doc.name).join(", ")} with user-supplied data and compliance checkpoints.`
      },
      {
        id: "counsel",
        title: "Match specialist counsel",
        description: `Scores attorneys by history in ${scenario.lawyerFocus}, availability, and rating before presenting quick actions.`
      }
    ],
    [scenario]
  );

  useEffect(() => {
    setActiveStep(0);
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % agentSteps.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [agentSteps]);

  const activeLawyers = useMemo(() => {
    if (scenario.id === "immigration") return lawyerBench.slice(0, 2);
    if (scenario.id === "tax") return lawyerBench.slice(0, 2);
    return [lawyerBench[1], lawyerBench[2]];
  }, [scenario.id]);

  const handleScenarioSwitch = (index) => {
    setScenarioIndex(index);
  };

  const handleDownload = (doc) => {
    const blob = buildDocumentPdf({
      scenarioTitle: scenario.title,
      intake: scenario.intake,
      docName: doc.name,
      docDetails: doc.details,
      lawyerFocus: scenario.lawyerFocus,
      sources: scenario.regulatory
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    const safeName = doc.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    anchor.download = `${safeName || "lexiflow-document"}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  return (
    <AppShell>
      <div className="page">
        <section className="container demo-grid" style={{ marginTop: "3rem" }}>
          <article className="demo-hero">
            <div>
              <h1>LexiFlow Demo Lab</h1>
              <p style={{ maxWidth: "620px" }}>
                Watch the agent orchestrate intake, paperwork, and attorney collaboration across immigration, tax, and
                real estate scenarios. Every field below is auto-populated from the user&apos;s inputs and live
                regulatory sources.
              </p>
            </div>
            <div className="scenario-tabs">
              {scenarios.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={`scenario-tab ${index === scenarioIndex ? "active" : ""}`}
                  onClick={() => handleScenarioSwitch(index)}
                  aria-pressed={index === scenarioIndex}
                >
                  {item.title.split("·")[0].trim()}
                </button>
              ))}
            </div>
            <div className="demo-cta">
              <Link className="btn btn-secondary" to="/login">
                Sign in to your workspace
              </Link>
              <Link className="btn btn-primary" to="/signup">
                Launch guided rollout
              </Link>
              <Link className="btn btn-secondary" to="/dashboard#assistant">
                Jump to assistant
              </Link>
            </div>
          </article>

          <div className="demo-split">
            <div className="input-simulator">
              <header style={{ marginBottom: "1rem" }}>
                <p style={{ margin: 0, textTransform: "uppercase", fontSize: "0.8rem", letterSpacing: "0.2em" }}>
                  Live intake
                </p>
                <p style={{ margin: "0.35rem 0 0", fontWeight: 600 }}>{scenario.title}</p>
              </header>
              <div className="typed-line">
                {typedText}
                <span>&nbsp;</span>
              </div>
              <footer style={{ marginTop: "1.4rem", fontSize: "0.85rem", display: "grid", gap: "0.4rem" }}>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.82)" }}>
                  Agent prompts: jurisdiction rules, document templates, regulatory scraping.
                </p>
                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                  {scenario.regulatory.map((source) => (
                    <span key={source} className="pill" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                      {source}
                    </span>
                  ))}
                </div>
              </footer>
            </div>
            <div className="doc-grid">
              {scenario.documents.map((doc) => (
                <article key={doc.name} className="doc-card">
                  <header>
                    <p style={{ margin: 0, fontWeight: 700 }}>{doc.name}</p>
                    <small>Draft ready for review</small>
                  </header>
                  <p style={{ margin: 0 }}>{doc.details}</p>
                  <button
                    className="btn btn-secondary"
                    style={{ justifySelf: "flex-start" }}
                    type="button"
                    onClick={() => handleDownload(doc)}
                  >
                    Generate PDF
                  </button>
                </article>
              ))}
            </div>
          </div>

          <section className="agent-flow">
            <header>
              <h2 className="section-title">How the agent handles this case</h2>
              <p className="muted">
                Steps light up as the workflow runs: parsing the intake, crawling trusted sources, assembling paperwork,
                and presenting counsel—all without leaving your dashboard.
              </p>
            </header>
            <div className="agent-timeline">
              {agentSteps.map((step, index) => (
                <article
                  key={step.id}
                  className={`agent-step ${index === activeStep ? "active" : ""} ${
                    index < activeStep ? "completed" : ""
                  }`}
                >
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
            <div className="source-pulse">
              {scenario.regulatory.map((source) => (
                <span key={source} className="pulse-chip">
                  {source}
                </span>
              ))}
            </div>
          </section>

          <section style={{ display: "grid", gap: "1.5rem" }}>
            <header>
              <h2 className="section-title">Recommended attorney bench</h2>
              <p className="muted">
                Matched by practice area, region, and workload. Ratings update after every engagement and availability
                syncs with lawyer calendars in real time.
              </p>
            </header>
            <div className="lawyer-bench">
              {activeLawyers.map((lawyer) => (
                <article key={lawyer.id} className="lawyer-card-demo">
                  <div className="lawyer-headline">
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>{lawyer.name}</p>
                      <p className="muted" style={{ margin: "0.2rem 0 0" }}>
                        {lawyer.specialty}
                      </p>
                    </div>
                    <span className="rating">{lawyer.rating.toFixed(1)}/5</span>
                  </div>
                  <p className="availability">{lawyer.availability}</p>
                  <div className="contact-actions">
                    <button>{lawyer.contact.chat}</button>
                    <button>Email: {lawyer.contact.email}</button>
                    <button>Call {lawyer.contact.phone}</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="pipeline">
            <header>
              <h2 className="section-title">Automation pipeline</h2>
              <p className="muted">
                The agent stitches together data scraping, regulation checks, and attorney review so your team focuses on
                decision making rather than paperwork assembly.
              </p>
            </header>
            <div className="pipeline-steps">
              {pipeline.map((step, index) => (
                <article key={step.stage} className="pipeline-item">
                  <header>
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      {index + 1}. {step.stage}
                    </p>
                    <span className="muted">{step.metric}</span>
                  </header>
                  <div className="progress-bar">
                    <span style={{ width: `${step.progress}%` }} />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="integration-banner">
            <h3>Connected to your document and regulatory stack</h3>
            <p className="muted">
              LexiFlow fills forms, pulls the right statutes, and attaches supporting evidence automatically. Configure
              integrations once and let the agent handle the rest.
            </p>
            <div className="integration-grid">
              {integrations.map((item) => (
                <span key={item} className="integration-chip">
                  {item}
                </span>
              ))}
            </div>
          </section>
        </section>
      </div>
    </AppShell>
  );
};

export default DemoShowcase;

const buildDocumentPdf = ({ scenarioTitle, intake, docName, docDetails, lawyerFocus, sources }) => {
  if (typeof window === "undefined") {
    return new Blob();
  }

  const wrapText = (text, width = 70) => {
    const words = text.split(" ");
    const lines = [];
    let current = "";
    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > width) {
        if (current) lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    });
    if (current) lines.push(current);
    return lines;
  };

  const escapePdfText = (text) => text.replace(/[\\()]/g, (match) => `\\${match}`);

  const lines = [];
  lines.push("BT");
  lines.push("/F1 18 Tf");
  lines.push("60 780 Td");
  lines.push(`(${escapePdfText(docName)}) Tj`);

  const addParagraph = (text, { lineHeight = 16, initialOffset = 24, bullet = false } = {}) => {
    const textLines = Array.isArray(text) ? text : wrapText(text);
    textLines.forEach((line, index) => {
      const offset = index === 0 ? initialOffset : lineHeight;
      const prefix = bullet && index === 0 ? "• " : bullet ? "  " : "";
      lines.push(`0 -${offset} Td`);
      lines.push(`(${escapePdfText(`${prefix}${line}`)}) Tj`);
    });
  };

  lines.push("/F1 11 Tf");
  addParagraph(`Scenario: ${scenarioTitle}`);
  addParagraph(intake, { initialOffset: 20 });
  addParagraph(`Focus counsel: ${lawyerFocus}`, { initialOffset: 20 });
  addParagraph(docDetails, { initialOffset: 20, bullet: true });
  addParagraph("Key sources:", { initialOffset: 24 });
  sources.forEach((source) => addParagraph(source, { initialOffset: 16, bullet: true }));
  lines.push("ET");

  const encoder = new TextEncoder();
  const stream = lines.join("\n") + "\n";
  const streamBytes = encoder.encode(stream);

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${streamBytes.length} >> stream\n${stream}endstream\nendobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj"
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  let position = encoder.encode(pdf).length;

  objects.forEach((object) => {
    offsets.push(position);
    pdf += `${object}\n`;
    position += encoder.encode(`${object}\n`).length;
  });

  const xrefStart = position;
  pdf += `xref\n0 ${offsets.length}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Root 1 0 R /Size ${offsets.length} >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
};
