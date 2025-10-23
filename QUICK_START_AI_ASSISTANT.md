# Quick Start Guide - AI Legal Assistant

## Prerequisites

- Docker and Docker Compose installed
- OpenAI API key (get from https://platform.openai.com/api-keys)

## Setup Steps (5 minutes)

### 1. Set OpenAI API Key

```bash
# Linux/Mac
export OPENAI_API_KEY=sk-your-actual-api-key-here

# Windows (PowerShell)
$env:OPENAI_API_KEY="sk-your-actual-api-key-here"
```

Alternatively, create a `.env` file in the project root:
```
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

### 2. Start the Application

```bash
# From the lexiflow directory
docker-compose up --build
```

Wait for all services to start (about 2-3 minutes on first build).

### 3. Access the Application

Open your browser to: **http://localhost:3000**

### 4. Create an Account

1. Click "Get started" or navigate to http://localhost:3000/signup
2. Fill in:
   - Company Name: "My Company"
   - Email: your-email@example.com
   - Password: (minimum 8 characters)
3. Click "Register"
4. Enter the verification code shown on screen
5. Click "Verify email"

### 5. Access the AI Assistant

1. After logging in, click "AI Assistant" in the top navigation
2. Click "New conversation"
3. Enter a title like "H1B Visa Process"
4. Click "Create"

### 6. Try Example Queries

**Example 1: H1B Sponsorship**
```
I have an employee who needs to go through H1B application.
Guide me through the overall steps and tell me what documents are needed.
```

**Example 2: Startup Hiring**
```
I want to hire an employee as a startup.
Tell me what I need to register, what documents to fill, etc.
```

**Example 3: STEM OPT**
```
What documents are needed for STEM OPT application and what's the process?
```

### 7. View Recommended Documents

After the AI responds:
- Documents will appear in the right sidebar (desktop) or within the message (mobile)
- Click "Download" to get official forms from government websites
- Required documents are marked with a "Required" badge

## Stopping the Application

```bash
# Press Ctrl+C in the terminal where docker-compose is running
# Or run:
docker-compose down
```

## Troubleshooting

### "OpenAI API key not configured"
- Make sure you set the `OPENAI_API_KEY` environment variable before running `docker-compose up`
- Or add it to the `.env` file

### "Request failed" or "Unauthorized"
- Log out and log back in
- Check that backend is running: `docker-compose ps`

### "Failed to connect to backend"
- Wait 30 seconds for all services to fully start
- Check backend logs: `docker-compose logs backend`

### Port Already in Use
```bash
# If port 3000 or 8080 is taken, stop other services or change ports in docker-compose.yml
docker-compose down
```

## What's Next?

- Try different types of questions about immigration and employment law
- Create multiple conversations for different topics
- Explore document recommendations
- Check out the full documentation in `AI_ASSISTANT_README.md`

## Architecture Overview

```
┌─────────────────┐
│   React App     │  ← User Interface (http://localhost:3000)
│  (Frontend)     │     - Chat interface
└────────┬────────┘     - Conversation management
         │
         │ HTTP/JSON
         ↓
┌─────────────────┐
│   Go Server     │  ← Backend API (http://localhost:8080)
│  (Backend)      │     - Chat endpoints
└────────┬────────┘     - OpenAI integration
         │               - Document matching
         │
    ┌────┴────┐
    ↓         ↓
┌────────┐ ┌──────────┐
│PostgreSQL│ │ OpenAI  │
│   DB     │ │   API   │
└──────────┘ └──────────┘
```

## Cost Estimate

Using the default `gpt-4o-mini` model:
- **~$0.001 per conversation** (10 messages)
- **~$1 for 1000 conversations**
- Budget accordingly based on expected usage

## Need Help?

1. Check `AI_ASSISTANT_README.md` for detailed documentation
2. Review logs: `docker-compose logs backend`
3. Check OpenAI status: https://status.openai.com/
