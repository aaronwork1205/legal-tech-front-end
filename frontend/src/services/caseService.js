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
