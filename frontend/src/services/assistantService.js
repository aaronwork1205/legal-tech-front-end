import { format } from "date-fns";
import { v4 as uuid } from "uuid";
import { derivePaperwork } from "./paperworkService.js";

const regulatoryMap = [
  { keyword: "gdpr", citation: "GDPR Art. 44 – Cross-border data transfer" },
  { keyword: "pipl", citation: "PIPL Chapter III – Personal information rules" },
  { keyword: "ccpa", citation: "CCPA §1798.100 – Consumer rights" },
  { keyword: "employment", citation: "Labor Contract Law Art. 39 – Employment compliance" },
  { keyword: "hipaa", citation: "HIPAA Security Rule 45 CFR Part 164" }
];

const lawyerPool = [
  { id: "km", name: "Karen Meng", expertise: "Data compliance", experience: "8 yrs", location: "Shanghai" },
  { id: "ac", name: "Avery Cole", expertise: "Employment & labor", experience: "11 yrs", location: "New York" },
  { id: "rl", name: "Riya Lal", expertise: "FinTech licensing", experience: "6 yrs", location: "Singapore" },
  { id: "jp", name: "Javier Prado", expertise: "LATAM privacy", experience: "9 yrs", location: "São Paulo" }
];

const tagsFor = (message) =>
  regulatoryMap
    .filter(({ keyword }) => message.toLowerCase().includes(keyword))
    .map(({ keyword }) => `#${keyword.toUpperCase()}`);

const findCitation = (message) => regulatoryMap.find(({ keyword }) => message.toLowerCase().includes(keyword));

export const converse = async ({ message, thread }) => {
  const id = uuid();
  const createdAt = new Date();

  const tags = tagsFor(message);
  const citation = findCitation(message);
  const replySegments = [];

  if (citation) {
    replySegments.push(`Referencing ${citation.citation}.`);
  }

  if (message.toLowerCase().includes("transfer") || message.toLowerCase().includes("cross-border")) {
    replySegments.push(
      "Document your data flow, classify personal data, and ensure destination safeguards align with adequacy standards."
    );
  } else if (message.toLowerCase().includes("contract")) {
    replySegments.push("Review liability caps, governing law, and data processing addenda before rollout.");
  } else if (message.toLowerCase().includes("employment")) {
    replySegments.push("Align policies with local statutory leave, termination notice, and payroll reporting requirements.");
  } else {
    replySegments.push("Let me outline the immediate steps, then suggest an attorney for deeper work.");
  }

  const paperwork = derivePaperwork({
    input: message,
    source: "conversation",
    metadata: {
      contextSnippet: message.slice(0, 240),
      threadLength: thread.length + 1
    }
  });

  if (paperwork) {
    replySegments.push(`I drafted a ${paperwork.title.toLowerCase()}. Download the sample to review required clauses.`);
  }

  const followUp = "Would you like me to invite a specialist from our verified attorney pool?";
  replySegments.push(followUp);

  const aiMessage = {
    id,
    role: "assistant",
    createdAt: format(createdAt, "HH:mm"),
    content: replySegments.join(" "),
    tags
  };

  const recommendations = lawyerPool
    .filter((lawyer) => {
      if (tags.includes("#GDPR") || tags.includes("#PIPL")) return ["km", "rl"].includes(lawyer.id);
      if (tags.includes("#EMPLOYMENT")) return lawyer.id === "ac";
      return true;
    })
    .slice(0, 2);

  const updatedSummary = summarise(thread.concat([{ role: "user", content: message }, aiMessage]));

  return {
    aiMessage,
    recommendations,
    updatedSummary,
    paperwork
  };
};

const summarise = (timeline) => {
  const latestUser = [...timeline].reverse().find((item) => item.role === "user")?.content ?? "";
  const risk = latestUser.toLowerCase().includes("transfer")
    ? "Cross-border data governance pending"
    : latestUser.toLowerCase().includes("contract")
      ? "Contractual terms under review"
      : "Awaiting next clarification";

  return {
    risk,
    nextSteps: [
      "Identify data categories involved",
      "Map applicable regulations",
      "Prepare draft briefing for attorney review"
    ]
  };
};

export const getLawyerPool = () => lawyerPool;
