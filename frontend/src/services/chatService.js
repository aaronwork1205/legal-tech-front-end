const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

const getAuthHeaders = () => {
  const sessionStr = window.localStorage.getItem("lexiflow:session");
  if (!sessionStr) return {};

  try {
    const session = JSON.parse(sessionStr);
    return {
      Authorization: `Bearer ${session.sessionToken || ""}`
    };
  } catch {
    return {};
  }
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers ?? {})
    },
    ...options
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message = data.error ?? message;
    } catch {
      // ignore parsing errors
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  return data;
};

// Create a new conversation
export const createConversation = async (title) => {
  return request("/chat/conversations", {
    method: "POST",
    body: JSON.stringify({ title })
  });
};

// Get all conversations for the user
export const getConversations = async () => {
  const response = await request("/chat/conversations", {
    method: "GET"
  });
  return response.conversations || [];
};

// Get a specific conversation with all messages
export const getConversation = async (conversationId) => {
  return request(`/chat/conversations/${conversationId}`, {
    method: "GET"
  });
};

// Send a message in a conversation
export const sendMessage = async (conversationId, content) => {
  return request(`/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content })
  });
};

// Delete a conversation
export const deleteConversation = async (conversationId) => {
  return request(`/chat/conversations/${conversationId}`, {
    method: "DELETE"
  });
};
