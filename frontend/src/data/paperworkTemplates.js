const samplePdfDataUrl =
  "data:application/pdf;base64,JVBERi0xLjQKJdP0zOEKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvQ29udGVudHMgNCAwIFIgPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA0NiA+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjEwMCA3MDAgVGQKKChMZXhpRmxvdyBTYW1wbGUgUGFwZXJ3b3JrKSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8IC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvTmFtZSAvRjEgL0Jhc2VGb250IC9IZWx2ZXRpY2EgPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDE4IDAwMDAwIG4gCjAwMDAwMDA5MiAwMDAwMCBuIAowMDAwMDAxNzIgMDAwMDAgbiAKMDAwMDAwMjYzIDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgNiAvUm9vdCAxIDAgUiAvSW5mbyA1IDAgUiA+PgpzdGFydHhyZWYKMjg0CiUlRU9G";

export const paperworkTemplates = [
  {
    id: "immigration-intake",
    title: "Immigration Sponsorship Intake Packet",
    summary: "Collect employee identity, role, and wage details to launch a visa sponsorship workflow.",
    keywords: ["visa", "immigration", "relocation", "passport", "h-1b", "work permit"],
    checklist: [
      "Capture employee identity and residency history",
      "Confirm role classification and prevailing wage data",
      "Gather dependent and travel history declarations",
      "Generate employer support letter template"
    ],
    sampleUrl: samplePdfDataUrl
  },
  {
    id: "employment-compliance",
    title: "Employment Policy Alignment Brief",
    summary: "Summarise hiring, termination, and payroll obligations for the target jurisdiction.",
    keywords: ["employment", "termination", "payroll", "labor", "overtime", "hr policy"],
    checklist: [
      "List statutory leave, notice, and severance requirements",
      "Flag collective bargaining or union obligations",
      "Review payroll frequency and reporting deadlines",
      "Capture probation and performance documentation needs"
    ],
    sampleUrl: samplePdfDataUrl
  },
  {
    id: "data-transfer",
    title: "Cross-Border Data Transfer Register",
    summary: "Document data categories, transfer destinations, and safeguards for regulatory review.",
    keywords: ["gdpr", "ccpa", "transfer", "data flow", "privacy", "pipl", "cross-border"],
    checklist: [
      "Map systems exporting personal data",
      "Identify lawful bases and transfer mechanisms",
      "Attach data protection impact assessment template",
      "Assign remediation owners and review cadence"
    ],
    sampleUrl: samplePdfDataUrl
  },
  {
    id: "contract-risk",
    title: "Commercial Contract Risk Checklist",
    summary: "Highlight negotiation guardrails for liability, security, and service delivery terms.",
    keywords: ["contract", "msa", "sla", "security", "liability", "indemnity"],
    checklist: [
      "Review liability caps and carve-outs",
      "Validate data security and breach notification clauses",
      "Track service level commitments and remedies",
      "Align governing law and dispute resolution choices"
    ],
    sampleUrl: samplePdfDataUrl
  }
];

const normalise = (input) => String(input ?? "").toLowerCase();

export const matchPaperworkTemplate = (input) => {
  const text = normalise(input);
  for (const template of paperworkTemplates) {
    const matches = template.keywords.filter((keyword) => text.includes(keyword));
    if (matches.length) {
      return { template, matches };
    }
  }
  return null;
};

export const samplePaperworkDataUrl = samplePdfDataUrl;
