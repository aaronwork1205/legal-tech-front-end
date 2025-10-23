# app.py

import streamlit as st
from typing_extensions import TypedDict, List
from langgraph.graph import StateGraph, START
from langchain_core.documents import Document
from setup import setup

# Page config
st.set_page_config(
    page_title="RAG Chatbot",
    page_icon="🤖",
    layout="centered"
)

# Initialize models and vector store (with caching)
@st.cache_resource
def init_rag_system():
    llm, vector_store, prompt = setup()

    # Define state
    class State(TypedDict):
        question: str
        context: List[Document]
        answer: str

    # Define steps
    def retrieve(state: State):
        retrieved_docs = vector_store.similarity_search(state["question"])
        return {"context": retrieved_docs}

    def generate(state: State):
        docs_content = "\n\n".join(doc.page_content for doc in state["context"])
        messages = prompt.invoke({"question": state["question"], "context": docs_content})
        response = llm.invoke(messages)
        return {"answer": response.content}

    # Build graph
    graph_builder = StateGraph(State).add_sequence([retrieve, generate])
    graph_builder.add_edge(START, "retrieve")
    graph = graph_builder.compile()

    return graph, llm, vector_store, prompt

# Initialize
with st.spinner("🔄 Loading RAG system..."):
    graph, llm, vector_store, prompt = init_rag_system()

# Title and description
st.title("⚖️ Legal Advisory Assistant")
st.markdown("Ask questions about immigration, employment law, and compliance for your organization!")

# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

# Initialize flag to track pending question from example buttons
if "pending_question" not in st.session_state:
    st.session_state.pending_question = None

# Display chat history
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Check if there's a pending question from example button
question = st.session_state.pending_question
if question:
    # Clear the pending question
    st.session_state.pending_question = None

# Always show chat input
chat_input = st.chat_input("Ask about legal compliance, immigration, employment law...")

# Use chat input only if there's no pending question
if not question:
    question = chat_input

if question:
    # Add user message to chat history
    st.session_state.messages.append({"role": "user", "content": question})
    
    # Display user message
    with st.chat_message("user"):
        st.markdown(question)
    
    # Display assistant response with streaming
    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        
        # Show thinking status
        with st.status("🔍 Searching knowledge base...", expanded=False) as status:
            # Retrieve context
            retrieved_docs = vector_store.similarity_search(question)
            st.write(f"Found {len(retrieved_docs)} relevant documents")
            status.update(label="✅ Context retrieved", state="complete")
        
        # Generate streaming response
        docs_content = "\n\n".join(doc.page_content for doc in retrieved_docs)
        messages = prompt.invoke({"question": question, "context": docs_content})
        
        full_response = ""
        
        # Stream the response
        for chunk in llm.stream(messages):
            full_response += chunk.content
            message_placeholder.markdown(full_response + "▌")
        
        message_placeholder.markdown(full_response)
    
    # Add assistant response to chat history
    st.session_state.messages.append({"role": "assistant", "content": full_response})

# Sidebar with info and controls
with st.sidebar:
    st.header("ℹ️ About")
    st.markdown("""
    This chatbot uses:
    - **LLM**: Claude 3.5 Sonnet
    - **Embeddings**: OpenAI
    - **Vector DB**: Milvus Lite
    - **Framework**: LangChain + LangGraph
    """)
    
    st.divider()
    
    st.header("💡 Example Questions")
    example_questions = [
        "What is STEM OPT and who is eligible?",
        "What are employer obligations for hiring international employees?",
        "What are the key compliance requirements for our organization?",
        "What documentation do we need for visa sponsorship?"
    ]
    
    for eq in example_questions:
        if st.button(eq, key=eq, use_container_width=True):
            st.session_state.pending_question = eq
            st.rerun()
    
    st.divider()
    
    # Clear chat button
    if st.button("🗑️ Clear Chat", use_container_width=True):
        st.session_state.messages = []
        st.rerun()
    
    st.divider()
    
    # Show document count
    st.metric("📚 Knowledge Base", "Legal Resources")