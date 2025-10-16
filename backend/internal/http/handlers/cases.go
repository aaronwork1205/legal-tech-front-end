package handlers

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
	"lexiflow/backend/internal/models"
)

type CaseHandler struct {
	db   *gorm.DB
	auth *AuthHandler
}

type createCaseRequest struct {
	Name              string                `json:"name" binding:"required"`
	Priority          string                `json:"priority"`
	Status            string                `json:"status"`
	MatterType        string                `json:"matterType"`
	Owner             string                `json:"owner"`
	Summary           string                `json:"summary"`
	AIFocus           string                `json:"aiFocus"`
	AIContext         map[string]any        `json:"aiContext"`
	AIUsage           map[string]any        `json:"aiUsage"`
	Stakeholders      []map[string]any      `json:"stakeholders"`
	Timeline          []map[string]any      `json:"timeline"`
	Tasks             []map[string]any      `json:"tasks"`
	Documents         []caseDocumentPayload `json:"documents"`
	PersonalDocuments []caseDocumentPayload `json:"personalDocuments"`
	Metadata          map[string]any        `json:"metadata"`
}

type caseDocumentPayload struct {
	Name        string `json:"name" binding:"required"`
	Owner       string `json:"owner"`
	Description string `json:"description"`
	Status      string `json:"status"`
	Category    string `json:"category"`
	StoragePath string `json:"storagePath"`
}

type attachDocumentRequest struct {
	Name        string `json:"name" binding:"required"`
	Owner       string `json:"owner"`
	Description string `json:"description"`
	Status      string `json:"status"`
	Category    string `json:"category"`
	StoragePath string `json:"storagePath"`
}

type caseResponse struct {
	ID         uuid.UUID              `json:"id"`
	Name       string                 `json:"name"`
	Priority   string                 `json:"priority"`
	Status     string                 `json:"status"`
	MatterType string                 `json:"matterType"`
	Owner      string                 `json:"owner"`
	Summary    string                 `json:"summary"`
	AIFocus    string                 `json:"aiFocus"`
	AIContext  map[string]any         `json:"aiContext,omitempty"`
	Metadata   map[string]any         `json:"metadata,omitempty"`
	Documents  []caseDocumentResponse `json:"documents"`
	CreatedAt  time.Time              `json:"createdAt"`
	UpdatedAt  time.Time              `json:"updatedAt"`
}

type caseDocumentResponse struct {
	ID          uuid.UUID `json:"id"`
	CaseID      uuid.UUID `json:"caseId"`
	Name        string    `json:"name"`
	Owner       string    `json:"owner"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	Category    string    `json:"category"`
	StoragePath string    `json:"storagePath"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func NewCaseHandler(db *gorm.DB, auth *AuthHandler) *CaseHandler {
	return &CaseHandler{db: db, auth: auth}
}

func (h *CaseHandler) RegisterRoutes(router *gin.RouterGroup) {
	cases := router.Group("/cases")
	{
		cases.GET("", h.handleListCases)
		cases.POST("", h.handleCreateCase)
		cases.GET("/:id", h.handleGetCase)
		cases.DELETE("/:id", h.handleDeleteCase)
		cases.POST("/:id/documents", h.handleAttachDocument)
		cases.DELETE("/:id/documents/:documentId", h.handleDeleteDocument)
	}
}

func (h *CaseHandler) handleCreateCase(ctx *gin.Context) {
	_, user, ok := h.auth.requireSession(ctx)
	if !ok {
		return
	}

	var req createCaseRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid case payload"})
		return
	}

	caseModel := models.Case{
		UserID:     user.ID,
		Name:       strings.TrimSpace(req.Name),
		Priority:   defaultString(req.Priority, "Medium"),
		Status:     defaultString(req.Status, "Draft"),
		MatterType: strings.TrimSpace(req.MatterType),
		Owner:      strings.TrimSpace(req.Owner),
		Summary:    strings.TrimSpace(req.Summary),
		AIFocus:    strings.TrimSpace(req.AIFocus),
	}

	if len(req.AIContext) > 0 {
		caseModel.AIContext = datatypes.JSONMap(req.AIContext)
	}

	meta := datatypes.JSONMap{}
	if len(req.AIUsage) > 0 {
		meta["aiUsage"] = req.AIUsage
	}
	if len(req.Stakeholders) > 0 {
		meta["stakeholders"] = req.Stakeholders
	}
	if len(req.Timeline) > 0 {
		meta["timeline"] = req.Timeline
	}
	if len(req.Tasks) > 0 {
		meta["tasks"] = req.Tasks
	}
	if len(req.Metadata) > 0 {
		for key, value := range req.Metadata {
			meta[key] = value
		}
	}
	if len(meta) > 0 {
		caseModel.Metadata = meta
	}

	documents := make([]models.CaseDocument, 0, len(req.Documents)+len(req.PersonalDocuments))
	for _, doc := range req.Documents {
		documents = append(documents, toCaseDocumentModel(doc, "case"))
	}
	for _, doc := range req.PersonalDocuments {
		documents = append(documents, toCaseDocumentModel(doc, "personal"))
	}
	caseModel.Documents = documents

	if err := h.db.Create(&caseModel).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create case"})
		return
	}

	ctx.JSON(http.StatusCreated, toCaseResponse(&caseModel))
}

func (h *CaseHandler) handleListCases(ctx *gin.Context) {
	_, user, ok := h.auth.requireSession(ctx)
	if !ok {
		return
	}

	var cases []models.Case
	if err := h.db.Preload("Documents").Where("user_id = ?", user.ID).Order("created_at DESC").Find(&cases).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to fetch cases"})
		return
	}

	payload := make([]caseResponse, 0, len(cases))
	for i := range cases {
		payload = append(payload, toCaseResponse(&cases[i]))
	}

	ctx.JSON(http.StatusOK, gin.H{"cases": payload})
}

func (h *CaseHandler) handleGetCase(ctx *gin.Context) {
	_, user, ok := h.auth.requireSession(ctx)
	if !ok {
		return
	}

	caseID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid case id"})
		return
	}

	var caseModel models.Case
	if err := h.db.Preload("Documents").Where("id = ? AND user_id = ?", caseID, user.ID).First(&caseModel).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Case not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to fetch case"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"case": toCaseResponse(&caseModel)})
}

func (h *CaseHandler) handleDeleteCase(ctx *gin.Context) {
	_, user, ok := h.auth.requireSession(ctx)
	if !ok {
		return
	}

	caseID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid case id"})
		return
	}

	if err := h.db.Where("id = ? AND user_id = ?", caseID, user.ID).Delete(&models.Case{}).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to delete case"})
		return
	}

	ctx.Status(http.StatusNoContent)
}

func (h *CaseHandler) handleAttachDocument(ctx *gin.Context) {
	_, user, ok := h.auth.requireSession(ctx)
	if !ok {
		return
	}

	caseID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid case id"})
		return
	}

	if err := h.ensureCaseBelongsToUser(caseID, user.ID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Case not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to validate case"})
		return
	}

	var req attachDocumentRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document payload"})
		return
	}

	document := toCaseDocumentModel(caseDocumentPayload(req), defaultString(req.Category, "case"))
	document.CaseID = caseID

	if err := h.db.Create(&document).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to attach document"})
		return
	}

	ctx.JSON(http.StatusCreated, caseDocumentResponse{
		ID:          document.ID,
		CaseID:      document.CaseID,
		Name:        document.Title,
		Owner:       document.Owner,
		Description: document.Description,
		Status:      document.Status,
		Category:    document.Category,
		StoragePath: document.StoragePath,
		CreatedAt:   document.CreatedAt,
		UpdatedAt:   document.UpdatedAt,
	})
}

func (h *CaseHandler) handleDeleteDocument(ctx *gin.Context) {
	_, user, ok := h.auth.requireSession(ctx)
	if !ok {
		return
	}

	caseID, err := uuid.Parse(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid case id"})
		return
	}

	documentID, err := uuid.Parse(ctx.Param("documentId"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid document id"})
		return
	}

	if err := h.ensureCaseBelongsToUser(caseID, user.ID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Case not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to validate case"})
		return
	}

	if err := h.db.Where("id = ? AND case_id = ?", documentID, caseID).Delete(&models.CaseDocument{}).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to delete document"})
		return
	}

	ctx.Status(http.StatusNoContent)
}

func (h *CaseHandler) ensureCaseBelongsToUser(caseID, userID uuid.UUID) error {
	var count int64
	if err := h.db.Model(&models.Case{}).Where("id = ? AND user_id = ?", caseID, userID).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func toCaseDocumentModel(payload caseDocumentPayload, defaultCategory string) models.CaseDocument {
	category := strings.TrimSpace(payload.Category)
	if category == "" {
		category = defaultCategory
	}
	return models.CaseDocument{
		Title:       strings.TrimSpace(payload.Name),
		Owner:       strings.TrimSpace(payload.Owner),
		Description: strings.TrimSpace(payload.Description),
		Status:      strings.TrimSpace(payload.Status),
		Category:    strings.ToLower(category),
		StoragePath: strings.TrimSpace(payload.StoragePath),
	}
}

func toCaseResponse(model *models.Case) caseResponse {
	resp := caseResponse{
		ID:         model.ID,
		Name:       model.Name,
		Priority:   model.Priority,
		Status:     model.Status,
		MatterType: model.MatterType,
		Owner:      model.Owner,
		Summary:    model.Summary,
		AIFocus:    model.AIFocus,
		CreatedAt:  model.CreatedAt,
		UpdatedAt:  model.UpdatedAt,
	}

	if len(model.AIContext) > 0 {
		resp.AIContext = map[string]any(model.AIContext)
	}

	if len(model.Metadata) > 0 {
		resp.Metadata = map[string]any(model.Metadata)
	}

	if len(model.Documents) > 0 {
		docs := make([]caseDocumentResponse, 0, len(model.Documents))
		for i := range model.Documents {
			doc := model.Documents[i]
			docs = append(docs, caseDocumentResponse{
				ID:          doc.ID,
				CaseID:      doc.CaseID,
				Name:        doc.Title,
				Owner:       doc.Owner,
				Description: doc.Description,
				Status:      doc.Status,
				Category:    doc.Category,
				StoragePath: doc.StoragePath,
				CreatedAt:   doc.CreatedAt,
				UpdatedAt:   doc.UpdatedAt,
			})
		}
		resp.Documents = docs
	} else {
		resp.Documents = []caseDocumentResponse{}
	}

	return resp
}

func defaultString(value, fallback string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return fallback
	}
	return value
}
