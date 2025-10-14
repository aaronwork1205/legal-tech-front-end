import { matchPaperworkTemplate, paperworkTemplates } from "../data/paperworkTemplates.js";

export const matchPaperwork = (input) => matchPaperworkTemplate(input);

export const buildPaperwork = ({ template, matches = [], source, metadata = {} }) => {
  if (!template) return null;
  return {
    id: `${template.id}-${Date.now()}`,
    templateId: template.id,
    title: template.title,
    description: template.summary,
    checklist: template.checklist,
    sampleUrl: template.sampleUrl,
    source,
    generatedAt: new Date().toISOString(),
    matches,
    metadata
  };
};

export const derivePaperwork = ({ input, source, metadata = {} }) => {
  const result = matchPaperworkTemplate(input);
  if (!result) return null;
  return buildPaperwork({
    template: result.template,
    matches: result.matches,
    source,
    metadata
  });
};

export const listPaperworkTemplates = () => paperworkTemplates;
