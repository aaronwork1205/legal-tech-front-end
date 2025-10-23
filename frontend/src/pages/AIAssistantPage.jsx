import { Fragment, useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell.jsx";
import { useAuth } from "../state/authContext.jsx";
import {
  createConversation,
  getConversations,
  getConversation,
  sendMessage as sendChatMessage,
  deleteConversation
} from "../services/chatService.js";
import "./AIAssistantPage.css";

const AIAssistantPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [newConversationTitle, setNewConversationTitle] = useState("");

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load conversation messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadConversationMessages(activeConversationId);
    }
  }, [activeConversationId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getConversations();
      setConversations(data);

      // Auto-select first conversation if none selected
      if (data.length > 0 && !activeConversationId) {
        setActiveConversationId(data[0].id);
      }
    } catch (err) {
      setError(err.message || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const loadConversationMessages = async (conversationId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getConversation(conversationId);
      setActiveConversation(data);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message || "Failed to load conversation");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConversation = async (e) => {
    e.preventDefault();
    if (!newConversationTitle.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const newConversation = await createConversation(newConversationTitle);
      setConversations([newConversation, ...conversations]);
      setActiveConversationId(newConversation.id);
      setNewConversationTitle("");
      setShowNewConversationModal(false);
    } catch (err) {
      setError(err.message || "Failed to create conversation");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversationId) return;

    const userMessageContent = messageInput;
    setMessageInput("");

    // Optimistically add user message
    const tempUserMessage = {
      id: Date.now(),
      role: "user",
      content: userMessageContent,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      setSending(true);
      setError(null);

      const response = await sendChatMessage(activeConversationId, userMessageContent);

      // Replace temp message with real one and add AI response
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempUserMessage.id);
        return [
          ...withoutTemp,
          {
            ...tempUserMessage,
            id: response.message.id || tempUserMessage.id
          },
          response.message
        ];
      });

      // Update conversation list timestamp
      loadConversations();
    } catch (err) {
      setError(err.message || "Failed to send message");
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
      setMessageInput(userMessageContent); // Restore input
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    if (!confirm("Are you sure you want to delete this conversation?")) return;

    try {
      setLoading(true);
      await deleteConversation(conversationId);
      setConversations(conversations.filter((c) => c.id !== conversationId));

      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
        setMessages([]);
        setActiveConversation(null);
      }
    } catch (err) {
      setError(err.message || "Failed to delete conversation");
    } finally {
      setLoading(false);
    }
  };

  const handleNewConversation = () => {
    setShowNewConversationModal(true);
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Extract documents from AI messages
  const documentsFromMessages = messages
    .filter((m) => m.role === "assistant" && m.documents)
    .flatMap((m) => {
      try {
        const docs = typeof m.documents === "string" ? JSON.parse(m.documents) : m.documents;
        return Array.isArray(docs) ? docs : [];
      } catch {
        return [];
      }
    });

  return (
    <AppShell>
      <div className="ai-assistant-page">
        <div className="ai-assistant-header">
          <div>
            <h1>AI Legal Assistant</h1>
            <p className="muted">
              Get guidance on immigration, employment law, and required documents for your situation.
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleNewConversation}>
            New conversation
          </button>
        </div>

        <div className="ai-assistant-layout">
          {/* Sidebar with conversations */}
          <aside className="ai-assistant-sidebar">
            <h3>Conversations</h3>
            {loading && conversations.length === 0 ? (
              <p className="muted">Loading...</p>
            ) : conversations.length === 0 ? (
              <p className="muted">No conversations yet. Start a new one!</p>
            ) : (
              <ul className="conversation-list">
                {conversations.map((conv) => (
                  <li
                    key={conv.id}
                    className={`conversation-item ${activeConversationId === conv.id ? "active" : ""}`}
                  >
                    <button className="conversation-button" onClick={() => setActiveConversationId(conv.id)}>
                      <strong>{conv.title}</strong>
                      <small className="muted">{formatTimestamp(conv.updatedAt)}</small>
                    </button>
                    <button
                      className="conversation-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                      title="Delete conversation"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {/* Main chat area */}
          <main className="ai-assistant-main">
            {!activeConversationId ? (
              <div className="ai-assistant-empty">
                <h2>Welcome to AI Legal Assistant</h2>
                <p>
                  Select a conversation from the sidebar or start a new one to get guidance on:
                </p>
                <ul>
                  <li>Hiring employees as a startup</li>
                  <li>H1B visa sponsorship process</li>
                  <li>STEM OPT applications</li>
                  <li>Employment documentation requirements</li>
                  <li>Immigration compliance</li>
                </ul>
              </div>
            ) : (
              <Fragment>
                {/* Messages */}
                <div className="ai-assistant-messages">
                  {messages.length === 0 ? (
                    <div className="ai-assistant-empty-chat">
                      <p className="muted">Start the conversation by asking a question...</p>
                      <div className="example-prompts">
                        <p><strong>Example questions:</strong></p>
                        <ul>
                          <li>"I want to hire an employee as a startup. What do I need to know?"</li>
                          <li>"Guide me through the H1B sponsorship process."</li>
                          <li>"What documents are needed for STEM OPT application?"</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className={`message message--${message.role}`}>
                        <div className="message-header">
                          <strong>{message.role === "user" ? "You" : "AI Assistant"}</strong>
                          <span className="muted">{formatTimestamp(message.createdAt)}</span>
                        </div>
                        <div className="message-content">
                          <p>{message.content}</p>
                          {message.role === "assistant" && message.documents && (
                            <DocumentList documents={message.documents} />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {sending && (
                    <div className="message message--assistant">
                      <div className="message-header">
                        <strong>AI Assistant</strong>
                      </div>
                      <div className="message-content">
                        <p className="muted">Thinking...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input form */}
                <form className="ai-assistant-input" onSubmit={handleSendMessage}>
                  {error && <p className="error-text">{error}</p>}
                  <input
                    type="text"
                    className="input"
                    placeholder="Ask about hiring, visas, documents, or legal requirements..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    disabled={sending || loading}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={sending || loading || !messageInput.trim()}
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </form>
              </Fragment>
            )}
          </main>

          {/* Documents panel */}
          {documentsFromMessages.length > 0 && (
            <aside className="ai-assistant-documents">
              <h3>Recommended Documents</h3>
              <div className="document-recommendations">
                {documentsFromMessages.map((doc, idx) => (
                  <div key={idx} className="document-card">
                    <h4>{doc.name}</h4>
                    <p className="muted">{doc.description}</p>
                    <div className="document-meta">
                      <span className="pill">{doc.category}</span>
                      {doc.required && <span className="pill pill-required">Required</span>}
                    </div>
                    {doc.downloadUrl && (
                      <a
                        href={doc.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                      >
                        Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>

        {/* New conversation modal */}
        {showNewConversationModal && (
          <div className="modal-overlay" onClick={() => setShowNewConversationModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <header className="modal-card__header">
                <h3>New Conversation</h3>
                <button type="button" className="link" onClick={() => setShowNewConversationModal(false)}>
                  Close
                </button>
              </header>
              <form onSubmit={handleCreateConversation}>
                <div className="form-group">
                  <label htmlFor="conversation-title">Conversation Title</label>
                  <input
                    id="conversation-title"
                    type="text"
                    className="input"
                    placeholder="e.g., H1B Visa Process"
                    value={newConversationTitle}
                    onChange={(e) => setNewConversationTitle(e.target.value)}
                    autoFocus
                  />
                </div>
                <footer className="modal-card__footer">
                  <button type="button" className="btn" onClick={() => setShowNewConversationModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={!newConversationTitle.trim()}>
                    Create
                  </button>
                </footer>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

const DocumentList = ({ documents }) => {
  let docList = [];
  try {
    docList = typeof documents === "string" ? JSON.parse(documents) : documents;
    if (!Array.isArray(docList)) docList = [];
  } catch {
    return null;
  }

  if (docList.length === 0) return null;

  return (
    <div className="message-documents">
      <h4>Recommended Documents:</h4>
      <ul>
        {docList.map((doc, idx) => (
          <li key={idx}>
            <strong>{doc.name}</strong>
            {doc.required && <span className="required-badge">Required</span>}
            <p>{doc.description}</p>
            {doc.downloadUrl && (
              <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer" className="download-link">
                Download →
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AIAssistantPage;
