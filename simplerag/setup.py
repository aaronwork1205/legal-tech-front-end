# setup.py

import os
import getpass
import bs4
from dotenv import load_dotenv
from langchain.chat_models import init_chat_model
from langchain_openai import OpenAIEmbeddings
from langchain_milvus import Milvus
from langchain_community.document_loaders import WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import ChatPromptTemplate

import streamlit as st

def setup_environment():
    """Ensure API keys are set."""
    load_dotenv()  # Load from .env

    import warnings
    warnings.filterwarnings('ignore')

    if not os.environ.get("ANTHROPIC_API_KEY"):
        raise ValueError("❌ Missing ANTHROPIC_API_KEY in .env file")
    if not os.environ.get("OPENAI_API_KEY"):
        raise ValueError("❌ Missing OPENAI_API_KEY in .env file")

def init_models():
    """Initialize models and embeddings."""
    llm = init_chat_model("claude-3-haiku-20240307", model_provider="anthropic")
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    return llm, embeddings

def create_custom_prompt():
    """Create a custom RAG prompt that includes download links for forms."""
    # Common USCIS form download links (only forms that can be downloaded online)
    form_links = {
        "I-765": "https://www.uscis.gov/sites/default/files/document/forms/i-765.pdf",
        "I-983": "https://www.ice.gov/doclib/sevis/pdf/i983.pdf",
        "I-9": "https://www.uscis.gov/sites/default/files/document/forms/i-9.pdf",
        "I-129": "https://www.uscis.gov/sites/default/files/document/forms/i-129.pdf",
        "I-140": "https://www.uscis.gov/sites/default/files/document/forms/i-140.pdf",
        "I-539": "https://www.uscis.gov/sites/default/files/document/forms/i-539.pdf",
    }

    form_links_text = "\n".join([f"- Form {form}: {link}" for form, link in form_links.items()])

    template = f"""You are a helpful legal assistant specializing in immigration and employment law for organizations.

Use the following context to answer the question. If you mention any USCIS forms that can be downloaded online, include the direct download link in markdown format.

Here are common form links you should use when mentioning these forms:
{form_links_text}

Important notes:
- For Form I-20: This is issued by schools, NOT downloadable from USCIS. Mention that students must obtain it from their Designated School Official (DSO).
- For Form I-94: Direct users to check their travel history at https://i94.cbp.dhs.gov/
- When mentioning downloadable forms, format them like: [Form I-765](https://www.uscis.gov/sites/default/files/document/forms/i-765.pdf)

Context:
{{context}}

Question: {{question}}

Answer: Provide a clear, professional answer with clickable links to downloadable forms and appropriate guidance for non-downloadable documents."""

    prompt = ChatPromptTemplate.from_template(template)
    return prompt

def build_vector_store(embeddings):
    """Load docs, split, and index them in provided web paths."""
    loader = WebBaseLoader(
        web_paths=("https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-extension-for-stem-students-stem-opt",),
        bs_kwargs=dict(parse_only=bs4.SoupStrainer(class_=("container container--main")))
    )
    docs = loader.load()

    """Split text into chunks."""
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    all_splits = text_splitter.split_documents(docs)

    vector_store = Milvus(embedding_function=embeddings, connection_args={"uri": "./demo.db"})
    vector_store.add_documents(documents=all_splits)

    return vector_store

def setup():
    """Main setup function to initialize everything."""
    setup_environment()
    llm, embeddings = init_models()
    vector_store = build_vector_store(embeddings)
    prompt = create_custom_prompt()
    return llm, vector_store, prompt
