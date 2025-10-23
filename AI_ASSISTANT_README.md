# AI Legal Assistant

## Overview

The AI Legal Assistant is a new feature that provides users with an intelligent chatbot interface to get guidance on immigration, employment law, and required documents for their specific situations.

## Features

### Core Functionality

1. **Conversational AI Interface**
   - Natural language chat interface
   - Powered by OpenAI GPT models (default: gpt-4o-mini)
   - Maintains conversation history
   - Multiple concurrent conversations

2. **Document Recommendations**
   - AI automatically identifies required documents based on user queries
   - Provides direct download links to official government forms
   - Categorizes documents (Immigration, Employment, Corporate, etc.)
   - Marks documents as required or optional

3. **Use Cases**
   - H1B visa sponsorship guidance
   - STEM OPT application processes
   - Employee hiring documentation
   - Immigration compliance requirements
   - Employment law questions

### Technical Architecture

#### Backend (Go)

**New Models:**
- `Conversation`: Stores conversation threads
- `ChatMessage`: Individual messages with role (user/assistant)

**API Endpoints:**
- `POST /api/v1/chat/conversations` - Create new conversation
- `GET /api/v1/chat/conversations` - List all user conversations
- `GET /api/v1/chat/conversations/:id` - Get conversation with messages
- `POST /api/v1/chat/conversations/:id/messages` - Send message
- `DELETE /api/v1/chat/conversations/:id` - Delete conversation

**LLM Integration:**
- OpenAI API integration via HTTP client
- Configurable model selection
- Document extraction from AI responses
- Automatic URL fetching for government forms

**Document Sources:**
- USCIS forms (I-129, I-140, I-765, I-9, I-983)
- Department of Labor forms
- IRS forms (W-4)
- SBA resources

#### Frontend (React)

**New Components:**
- `AIAssistantPage`: Main chat interface
- `DocumentList`: Display recommended documents
- Conversation management UI
- Message threading

**Services:**
- `chatService.js`: API client for chat endpoints

**Styling:**
- `AIAssistantPage.css`: Responsive chat interface
- Three-column layout (sidebar, chat, documents)
- Mobile-responsive design

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

**Get your OpenAI API key:**
1. Visit https://platform.openai.com/api-keys
2. Sign up or log in
3. Create a new API key
4. Copy and paste into `.env`

### 2. Database Migration

The database will automatically migrate when you start the backend. The new tables created are:

- `conversations` - Stores conversation threads
- `chat_messages` - Stores individual messages

### 3. Running the Application

#### Development Mode

**Backend:**
```bash
cd backend
export OPENAI_API_KEY=your_api_key_here
go run main.go
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

#### Production Mode (Docker)

```bash
# Set environment variable
export OPENAI_API_KEY=your_api_key_here

# Start all services
docker-compose up --build
```

Access the application at: http://localhost:3000

### 4. Access the AI Assistant

1. Log in to your account
2. Navigate to "AI Assistant" in the top navigation
3. Click "New conversation" to start
4. Ask questions like:
   - "I want to hire an employee as a startup. What do I need?"
   - "Guide me through the H1B sponsorship process"
   - "What documents are needed for STEM OPT application?"

## Usage Examples

### Example 1: H1B Visa Sponsorship

**User Query:**
```
"I have an employee who needs to go through H1B application. Guide me through the overall steps and tell me what documents are needed."
```

**AI Response:**
The AI will:
1. Explain the H1B process step by step
2. List required documents (I-129, Labor Condition Application, etc.)
3. Provide downloadable links to official forms
4. Mark which documents are required vs optional

### Example 2: Startup Hiring

**User Query:**
```
"I want to hire an employee as a startup. Tell me what I need to register, what documents to fill, etc."
```

**AI Response:**
The AI will:
1. Explain employer registration requirements
2. List required forms (W-4, I-9, state-specific forms)
3. Provide links to IRS and DOL forms
4. Explain compliance requirements

## Configuration

### Changing the AI Model

Edit `docker-compose.yml` or set environment variable:

```yaml
OPENAI_MODEL: gpt-4o  # More powerful but more expensive
```

Available models:
- `gpt-4o-mini` (default, cost-effective)
- `gpt-4o` (most capable)
- `gpt-4-turbo`
- `gpt-3.5-turbo` (fastest, cheapest)

### Adding More Document Sources

Edit `backend/internal/http/handlers/chat.go`:

```go
knownDocuments := map[string]string{
    "Your Document Name": "https://official-url.gov/form.pdf",
    // Add more mappings
}
```

## Troubleshooting

### OpenAI API Errors

**Error: "OpenAI API key not configured"**
- Solution: Set `OPENAI_API_KEY` environment variable

**Error: "Rate limit exceeded"**
- Solution: Wait a moment or upgrade your OpenAI plan

**Error: "Model not found"**
- Solution: Check that your OpenAI account has access to the specified model

### Database Issues

**Error: "Table doesn't exist"**
- Solution: Restart the backend to trigger migrations

### Frontend Issues

**Error: "Unauthorized"**
- Solution: Log out and log back in to refresh session token

**Error: "Failed to load conversations"**
- Solution: Check that backend is running and CORS is configured

## API Documentation

### Create Conversation

```http
POST /api/v1/chat/conversations
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "H1B Visa Process"
}
```

### Send Message

```http
POST /api/v1/chat/conversations/{id}/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "What documents do I need for H1B?"
}
```

**Response:**
```json
{
  "message": {
    "id": "uuid",
    "conversationId": "uuid",
    "role": "assistant",
    "content": "For H1B sponsorship, you'll need...",
    "documents": "[{\"name\":\"I-129\",\"downloadUrl\":\"...\"}]",
    "createdAt": "2024-10-20T12:00:00Z"
  },
  "documents": [
    {
      "name": "Form I-129",
      "description": "Petition for a Nonimmigrant Worker",
      "category": "Immigration",
      "downloadUrl": "https://www.uscis.gov/.../i-129.pdf",
      "required": true
    }
  ]
}
```

## Cost Considerations

### OpenAI API Pricing (as of 2024)

- **gpt-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **gpt-4o**: ~$2.50 per 1M input tokens, ~$10.00 per 1M output tokens

### Typical Usage

Average conversation:
- ~10 messages
- ~2000 tokens total
- **Cost**: $0.001 - $0.02 per conversation (depending on model)

## Security Considerations

1. **API Keys**: Never commit OpenAI API keys to version control
2. **User Authentication**: All endpoints require valid session tokens
3. **Data Privacy**: Conversations are user-scoped and isolated
4. **HTTPS**: Use HTTPS in production
5. **Rate Limiting**: Consider implementing rate limits per user

## Future Enhancements

Potential improvements:
- [ ] Claude AI support as alternative to OpenAI
- [ ] Document upload and analysis
- [ ] RAG (Retrieval Augmented Generation) for legal knowledge base
- [ ] Export conversations as PDF
- [ ] Share conversations with team members
- [ ] Integration with case management system
- [ ] Multi-language support
- [ ] Voice input/output

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs: `docker-compose logs backend`
3. Review frontend console for errors
4. Check OpenAI API status: https://status.openai.com/

## License

This feature is part of the LexiFlow SaaS application.
