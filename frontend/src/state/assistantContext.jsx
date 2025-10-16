import { createContext, useCallback, useContext, useMemo, useReducer } from "react";
import { converse, getLawyerPool } from "../services/assistantService.js";
import { derivePaperwork } from "../services/paperworkService.js";
import { v4 as uuid } from "uuid";

const AssistantContext = createContext(null);

const initialState = {
  messages: [
    {
      id: "seed-1",
      role: "assistant",
      createdAt: "09:00",
      content:
        "Hi, I'm LexiFlow. Give me context about your legal challenge and I'll outline the next steps before looping in a specialist.",
      tags: ["#WELCOME"]
    }
  ],
  summary: {
    risk: "Awaiting initial intake",
    nextSteps: ["Share your scenario", "Confirm jurisdictions involved", "Flag target launch timeline"]
  },
  recommendations: getLawyerPool().slice(0, 2),
  processing: false,
  uploading: false,
  error: null,
  uploads: [],
  paperwork: null,
  paperworkLog: [],
  usage: {
    messages: 0,
    documents: 0,
    paperwork: 0
  },
  cases: [],
  activeCaseId: null
};

const assistantReducer = (state, action) => {
  switch (action.type) {
    case "SEND": {
      return {
        ...state,
        messages: state.messages.concat(action.payload),
        processing: true,
        error: null,
        usage: {
          ...state.usage,
          messages: state.usage.messages + 1
        }
      };
    }
    case "RESPONSE": {
      const { aiMessage, recommendations, updatedSummary, paperwork } = action.payload;
      const nextSummary = paperwork
        ? {
            risk: `Draft ready: ${paperwork.title}`,
            nextSteps: paperwork.checklist.slice(0, 3)
          }
        : updatedSummary;
      const nextPaperworkLog = paperwork ? [paperwork, ...state.paperworkLog].slice(0, 5) : state.paperworkLog;
      return {
        ...state,
        messages: state.messages.concat(aiMessage),
        recommendations,
        summary: nextSummary,
        processing: false,
        paperwork: paperwork ?? state.paperwork,
        paperworkLog: nextPaperworkLog,
        error: null,
        usage: {
          ...state.usage,
          paperwork: paperwork ? state.usage.paperwork + 1 : state.usage.paperwork
        }
      };
    }
    case "UPLOAD_START":
      return { ...state, uploading: true, error: null };
    case "UPLOAD_SUCCESS": {
      const { upload, paperwork } = action.payload;
      const uploads = [upload, ...state.uploads].slice(0, 5);
      const nextPaperworkLog = paperwork ? [paperwork, ...state.paperworkLog].slice(0, 5) : state.paperworkLog;
      const nextSummary = paperwork
        ? {
            risk: `Document ready: ${paperwork.title}`,
            nextSteps: paperwork.checklist.slice(0, 3)
          }
        : {
            risk: `Document queued: ${upload.name}`,
            nextSteps: [
              "Tag regulation keywords in the conversation",
              "Attach clarifying context for reviewers",
              "Assign a reviewer to confirm requirements"
            ]
          };
      return {
        ...state,
        uploading: false,
        uploads,
        paperwork: paperwork ?? state.paperwork,
        paperworkLog: nextPaperworkLog,
        summary: nextSummary,
        error: null,
        usage: {
          ...state.usage,
          documents: state.usage.documents + 1,
          paperwork: paperwork ? state.usage.paperwork + 1 : state.usage.paperwork
        }
      };
    }
    case "UPLOAD_FAILURE":
      return { ...state, uploading: false, error: action.payload };
    case "ERROR":
      return { ...state, processing: false, uploading: false, error: action.payload };
    case "CREATE_CASE":
      return {
        ...state,
        cases: [action.payload, ...state.cases],
        activeCaseId: action.payload.id
      };
    case "SET_ACTIVE_CASE":
      return {
        ...state,
        activeCaseId: action.payload
      };
    default:
      return state;
  }
};

const extractDocumentInsights = (text) => {
  const lower = String(text ?? "").toLowerCase();
  const topics = [];
  if (lower.match(/visa|immigration|passport/)) topics.push("Immigration");
  if (lower.match(/employment|termination|payroll|hr/)) topics.push("Employment");
  if (lower.match(/contract|msa|sla|agreement/)) topics.push("Contracts");
  if (lower.match(/gdpr|ccpa|privacy|data/)) topics.push("Data privacy");

  let jurisdiction = null;
  if (lower.match(/\bchina|prc|shanghai\b/)) jurisdiction = "China";
  else if (lower.match(/\busa|united states|california|new york\b/)) jurisdiction = "United States";
  else if (lower.match(/\beu|france|germany|european\b/)) jurisdiction = "European Union";

  const emails = (text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? []).slice(0, 3);
  const dates = (text.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? []).slice(0, 2);

  return {
    topics,
    jurisdiction,
    emails,
    dates
  };
};

export const AssistantProvider = ({ children }) => {
  const [state, dispatch] = useReducer(assistantReducer, initialState);

  const sendMessage = useCallback(
    async (content) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const message = {
        id: uuid(),
      role: "user",
      createdAt: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      content: trimmed
    };

    dispatch({ type: "SEND", payload: message });

    try {
      const response = await converse({ message: trimmed, thread: state.messages.concat(message) });
      dispatch({ type: "RESPONSE", payload: response });
    } catch (error) {
      dispatch({ type: "ERROR", payload: error.message });
    }
    },
    [state.messages]
  );

  const uploadDocument = useCallback(async (file) => {
    if (!file) return null;
    dispatch({ type: "UPLOAD_START" });

    try {
      const text = await file.text();
      const insights = extractDocumentInsights(text);
      const upload = {
        id: uuid(),
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        preview: text.slice(0, 220),
        insights
      };

      const paperwork = derivePaperwork({
        input: `${file.name} ${text}`,
        source: "document-upload",
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          detectedTopics: insights.topics,
          detectedJurisdiction: insights.jurisdiction
        }
      });

      dispatch({ type: "UPLOAD_SUCCESS", payload: { upload, paperwork } });
      return { upload, paperwork };
    } catch (error) {
      dispatch({
        type: "UPLOAD_FAILURE",
        payload: "Unable to process the file. Try uploading a text or PDF export under 5 MB."
      });
      return null;
    }
  }, []);

  const createCase = useCallback((caseData) => {
    const now = new Date();
    const enrichedCase = {
      id: uuid(),
      createdAt: now.toISOString(),
      status: "Active",
      ...caseData
    };
    dispatch({ type: "CREATE_CASE", payload: enrichedCase });
    return enrichedCase;
  }, []);

  const setActiveCase = useCallback((caseId) => {
    dispatch({ type: "SET_ACTIVE_CASE", payload: caseId });
  }, []);

  const activeCase = useMemo(
    () => state.cases.find((item) => item.id === state.activeCaseId) ?? null,
    [state.cases, state.activeCaseId]
  );

  const value = useMemo(
    () => ({
      messages: state.messages,
      summary: state.summary,
      recommendations: state.recommendations,
      processing: state.processing,
      uploading: state.uploading,
      uploads: state.uploads,
      paperwork: state.paperwork,
      paperworkLog: state.paperworkLog,
      usage: state.usage,
      error: state.error,
      sendMessage,
      uploadDocument,
      cases: state.cases,
      createCase,
      activeCase,
      setActiveCase
    }),
    [
      state.messages,
      state.summary,
      state.recommendations,
      state.processing,
      state.uploading,
      state.uploads,
      state.paperwork,
      state.paperworkLog,
      state.usage,
      state.error,
      sendMessage,
      uploadDocument,
      state.cases,
      createCase,
      activeCase,
      setActiveCase
    ]
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
};

export const useAssistant = () => {
  const context = useContext(AssistantContext);
  if (!context) throw new Error("useAssistant must be used within AssistantProvider");
  return context;
};
