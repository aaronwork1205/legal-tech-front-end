import { createContext, useContext, useMemo, useReducer } from "react";
import { converse, getLawyerPool } from "../services/assistantService.js";
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
  error: null
};

const assistantReducer = (state, action) => {
  switch (action.type) {
    case "SEND":
      return {
        ...state,
        messages: state.messages.concat(action.payload),
        processing: true,
        error: null
      };
    case "RESPONSE":
      return {
        ...state,
        messages: state.messages.concat(action.payload.aiMessage),
        recommendations: action.payload.recommendations,
        summary: action.payload.updatedSummary,
        processing: false
      };
    case "ERROR":
      return { ...state, processing: false, error: action.payload };
    default:
      return state;
  }
};

export const AssistantProvider = ({ children }) => {
  const [state, dispatch] = useReducer(assistantReducer, initialState);

  const sendMessage = async (content) => {
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
  };

  const value = useMemo(
    () => ({
      messages: state.messages,
      summary: state.summary,
      recommendations: state.recommendations,
      processing: state.processing,
      error: state.error,
      sendMessage
    }),
    [state.messages, state.summary, state.recommendations, state.processing, state.error]
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
};

export const useAssistant = () => {
  const context = useContext(AssistantContext);
  if (!context) throw new Error("useAssistant must be used within AssistantProvider");
  return context;
};
