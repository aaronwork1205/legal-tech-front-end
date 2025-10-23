# main.py

from typing_extensions import TypedDict, List
from langchain import hub
from langgraph.graph import StateGraph, START
from langchain_core.documents import Document
from setup import setup

# Initialize models and vector store
llm, vector_store = setup()

# Pull RAG prompt
prompt = hub.pull("rlm/rag-prompt")

# Define state for application
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

# Build and run graph
graph_builder = StateGraph(State).add_sequence([retrieve, generate])
graph_builder.add_edge(START, "retrieve")
graph = graph_builder.compile()

# Example query
if __name__ == "__main__":
    question = "What data types does Milvus support?"
    response = graph.invoke({"question": question})
    print(response["answer"])
