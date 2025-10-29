import { apiRequest } from "./authService.js";

export const listCases = async () => {
  const data = await apiRequest("/cases", {
    method: "GET"
  });
  return data?.cases ?? [];
};

export const getCase = async (caseId) => {
  const data = await apiRequest(`/cases/${caseId}`, {
    method: "GET"
  });
  return data?.case ?? null;
};

export const assignLawyer = async ({ caseId, lawyerId, notes }) => {
  const data = await apiRequest(`/cases/${caseId}/assign`, {
    method: "POST",
    body: JSON.stringify({ lawyerId, notes })
  });
  return data?.assignment ?? null;
};

export const uploadCaseDocument = async ({ caseId, file, category, owner, description, status }) => {
  const formData = new FormData();
  formData.append("file", file);
  if (category) formData.append("category", category);
  if (owner) formData.append("owner", owner);
  if (description) formData.append("description", description);
  if (status) formData.append("status", status);

  const data = await apiRequest(`/cases/${caseId}/documents/upload`, {
    method: "POST",
    body: formData
  });
  return data?.document ?? null;
};
