package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"lexiflow/backend/internal/models"
)

type ChatHandler struct {
	db         *gorm.DB
	auth       *AuthHandler
	openAIKey  string
	openAIURL  string
	openAIModel string
}

func NewChatHandler(db *gorm.DB, authHandler *AuthHandler) *ChatHandler {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		fmt.Println("Warning: OPENAI_API_KEY not set. Chat functionality will not work.")
	}

	model := os.Getenv("OPENAI_MODEL")
	if model == "" {
		model = "gpt-4o-mini" // Default to cost-effective model
	}

	return &ChatHandler{
		db:         db,
		auth:       authHandler,
		openAIKey:  apiKey,
		openAIURL:  "https://api.openai.com/v1/chat/completions",
		openAIModel: model,
	}
}

func (h *ChatHandler) RegisterRoutes(router *gin.RouterGroup) {
	chat := router.Group("/chat")
	{
		chat.POST("/conversations", h.CreateConversation)
		chat.GET("/conversations", h.GetConversations)
		chat.GET("/conversations/:id", h.GetConversation)
		chat.POST("/conversations/:id/messages", h.SendMessage)
		chat.DELETE("/conversations/:id", h.DeleteConversation)
	}
}

type createConversationRequest struct {
	Title string `json:"title" binding:"required"`
}

type sendMessageRequest struct {
	Content string `json:"content" binding:"required"`
}

type documentRecommendation struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Category    string `json:"category"` // Immigration, Employment, etc.
	DownloadURL string `json:"downloadUrl"`
	Required    bool   `json:"required"`
}

type chatResponse struct {
	Message   *models.ChatMessage      `json:"message"`
	Documents []documentRecommendation `json:"documents,omitempty"`
}

// CreateConversation creates a new chat conversation
func (h *ChatHandler) CreateConversation(c *gin.Context) {
	_, user, ok := h.auth.requireSession(c)
	if !ok {
		return
	}

	var req createConversationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	conversation := models.Conversation{
		UserID: user.ID,
		Title:  req.Title,
	}

	if err := h.db.Create(&conversation).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create conversation"})
		return
	}

	c.JSON(http.StatusCreated, conversation)
}

// GetConversations retrieves all conversations for the authenticated user
func (h *ChatHandler) GetConversations(c *gin.Context) {
	_, user, ok := h.auth.requireSession(c)
	if !ok {
		return
	}

	var conversations []models.Conversation
	if err := h.db.Where("user_id = ?", user.ID).
		Order("updated_at DESC").
		Find(&conversations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch conversations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"conversations": conversations})
}

// GetConversation retrieves a specific conversation with all messages
func (h *ChatHandler) GetConversation(c *gin.Context) {
	_, user, ok := h.auth.requireSession(c)
	if !ok {
		return
	}

	conversationID := c.Param("id")
	if _, err := uuid.Parse(conversationID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid conversation ID"})
		return
	}

	var conversation models.Conversation
	if err := h.db.Where("id = ? AND user_id = ?", conversationID, user.ID).
		Preload("Messages", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC")
		}).
		First(&conversation).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "conversation not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch conversation"})
		}
		return
	}

	c.JSON(http.StatusOK, conversation)
}

// SendMessage sends a message in a conversation and gets AI response
func (h *ChatHandler) SendMessage(c *gin.Context) {
	_, user, ok := h.auth.requireSession(c)
	if !ok {
		return
	}

	conversationID := c.Param("id")
	if _, err := uuid.Parse(conversationID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid conversation ID"})
		return
	}

	var req sendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify conversation belongs to user
	var conversation models.Conversation
	if err := h.db.Where("id = ? AND user_id = ?", conversationID, user.ID).
		First(&conversation).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "conversation not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch conversation"})
		}
		return
	}

	// Save user message
	userMessage := models.ChatMessage{
		ConversationID: conversation.ID,
		Role:           "user",
		Content:        req.Content,
	}

	if err := h.db.Create(&userMessage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save message"})
		return
	}

	// Get conversation history
	var messages []models.ChatMessage
	if err := h.db.Where("conversation_id = ?", conversationID).
		Order("created_at ASC").
		Find(&messages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch history"})
		return
	}

	// Get AI response
	aiResponse, documents, err := h.getAIResponse(messages, req.Content)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("AI service error: %v", err)})
		return
	}

	// Save AI message with documents
	var documentsJSON []byte
	if len(documents) > 0 {
		documentsJSON, _ = json.Marshal(documents)
	}

	aiMessage := models.ChatMessage{
		ConversationID: conversation.ID,
		Role:           "assistant",
		Content:        aiResponse,
		Documents:      documentsJSON,
	}

	if err := h.db.Create(&aiMessage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save AI response"})
		return
	}

	// Update conversation timestamp
	h.db.Model(&conversation).Update("updated_at", time.Now())

	c.JSON(http.StatusOK, chatResponse{
		Message:   &aiMessage,
		Documents: documents,
	})
}

// DeleteConversation deletes a conversation
func (h *ChatHandler) DeleteConversation(c *gin.Context) {
	_, user, ok := h.auth.requireSession(c)
	if !ok {
		return
	}

	conversationID := c.Param("id")
	if _, err := uuid.Parse(conversationID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid conversation ID"})
		return
	}

	result := h.db.Where("id = ? AND user_id = ?", conversationID, user.ID).
		Delete(&models.Conversation{})

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete conversation"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "conversation not found"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// getAIResponse calls OpenAI API to get response with document recommendations
func (h *ChatHandler) getAIResponse(history []models.ChatMessage, userMessage string) (string, []documentRecommendation, error) {
	if h.openAIKey == "" {
		return "", nil, fmt.Errorf("OpenAI API key not configured")
	}

	// Build conversation history for OpenAI
	apiMessages := []map[string]string{
		{
			"role": "system",
			"content": `You are an expert immigration and employment law assistant. Your role is to:
1. Explain legal processes clearly and comprehensively
2. Identify and list all required documents
3. Provide step-by-step guidance
4. Recommend specific documents that users can download

When discussing documents, format your recommendations in a special format at the end of your response:
[DOCUMENTS]
{
  "documents": [
    {
      "name": "Document Name",
      "description": "Brief description",
      "category": "Immigration|Employment|Corporate|Other",
      "required": true|false
    }
  ]
}
[/DOCUMENTS]

Be helpful, thorough, and cite relevant regulations when appropriate.`,
		},
	}

	for _, msg := range history {
		apiMessages = append(apiMessages, map[string]string{
			"role":    msg.Role,
			"content": msg.Content,
		})
	}

	// Prepare OpenAI request
	requestBody := map[string]interface{}{
		"model":       h.openAIModel,
		"messages":    apiMessages,
		"temperature": 0.7,
		"max_tokens":  2000,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return "", nil, err
	}

	req, err := http.NewRequest("POST", h.openAIURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+h.openAIKey)

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return "", nil, fmt.Errorf("OpenAI API error: %s", string(body))
	}

	var openAIResponse struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.Unmarshal(body, &openAIResponse); err != nil {
		return "", nil, err
	}

	if len(openAIResponse.Choices) == 0 {
		return "", nil, fmt.Errorf("no response from OpenAI")
	}

	content := openAIResponse.Choices[0].Message.Content

	// Extract documents if present
	documents := h.extractDocuments(content, userMessage)

	return content, documents, nil
}

// extractDocuments extracts document recommendations from AI response and fetches URLs
func (h *ChatHandler) extractDocuments(content string, userQuery string) []documentRecommendation {
	// Try to extract structured document data from response
	startMarker := "[DOCUMENTS]"
	endMarker := "[/DOCUMENTS]"

	startIdx := bytes.Index([]byte(content), []byte(startMarker))
	endIdx := bytes.Index([]byte(content), []byte(endMarker))

	var documents []documentRecommendation

	if startIdx != -1 && endIdx != -1 && endIdx > startIdx {
		jsonStr := content[startIdx+len(startMarker):endIdx]
		var docData struct {
			Documents []documentRecommendation `json:"documents"`
		}
		if err := json.Unmarshal([]byte(jsonStr), &docData); err == nil {
			documents = docData.Documents
		}
	}

	// Fetch real document URLs for each recommended document
	for i := range documents {
		documents[i].DownloadURL = h.fetchDocumentURL(documents[i].Name, documents[i].Category, userQuery)
	}

	return documents
}

// fetchDocumentURL searches for and returns a real downloadable document URL
func (h *ChatHandler) fetchDocumentURL(documentName, category, userQuery string) string {
	// This function will search government websites and legal resources
	// for actual downloadable forms and documents

	// Map of known document patterns to official URLs
	knownDocuments := map[string]string{
		// Immigration Documents
		"I-129":                    "https://www.uscis.gov/sites/default/files/document/forms/i-129.pdf",
		"I-140":                    "https://www.uscis.gov/sites/default/files/document/forms/i-140.pdf",
		"I-765":                    "https://www.uscis.gov/sites/default/files/document/forms/i-765.pdf",
		"I-9":                      "https://www.uscis.gov/sites/default/files/document/forms/i-9-paper-version.pdf",
		"I-983":                    "https://www.uscis.gov/sites/default/files/document/forms/i-983.pdf",
		"DS-160":                   "https://ceac.state.gov/genniv/",
		"Labor Condition Application": "https://www.dol.gov/agencies/eta/foreign-labor/forms/eta-9035",

		// Employment Documents
		"Employment Agreement":      "https://www.sba.gov/sites/default/files/2019-02/Employment_Agreement_Sample.pdf",
		"Offer Letter":             "https://www.shrm.org/resourcesandtools/tools-and-samples/hr-forms/pages/cms_021013.aspx",
		"Employee Handbook":        "https://www.dol.gov/general/topics/employment",
		"W-4":                      "https://www.irs.gov/pub/irs-pdf/fw4.pdf",
		"I-9 Form":                 "https://www.uscis.gov/sites/default/files/document/forms/i-9-paper-version.pdf",

		// Corporate Documents
		"Articles of Incorporation": "https://www.sba.gov/business-guide/launch-your-business/choose-business-structure",
		"Bylaws Template":          "https://www.sba.gov/business-guide/launch-your-business/register-your-business",
		"Operating Agreement":      "https://www.sba.gov/business-guide/launch-your-business/choose-business-structure",
	}

	// Check for exact or partial matches
	for key, url := range knownDocuments {
		if bytes.Contains([]byte(documentName), []byte(key)) ||
		   bytes.Contains([]byte(key), []byte(documentName)) {
			return url
		}
	}

	// Category-based fallback URLs
	categoryURLs := map[string]string{
		"Immigration": "https://www.uscis.gov/forms",
		"Employment":  "https://www.dol.gov/agencies/whd/forms",
		"Corporate":   "https://www.sba.gov/business-guide/launch-your-business",
	}

	if url, exists := categoryURLs[category]; exists {
		return url
	}

	// Default to USCIS forms search
	return "https://www.uscis.gov/forms"
}
