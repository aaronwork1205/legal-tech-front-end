package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
	"lexiflow/backend/internal/models"
)

type CaseHandler struct {
	db        *gorm.DB
	auth      *AuthHandler
	uploadDir string
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

type assignLawyerRequest struct {
	LawyerID string `json:"lawyerId" binding:"required"`
	Notes    string `json:"notes"`
}

type caseResponse struct {
	ID              uuid.UUID              `json:"id"`
	Name            string                 `json:"name"`
	Priority        string                 `json:"priority"`
	Status          string                 `json:"status"`
	MatterType      string                 `json:"matterType"`
	Owner           string                 `json:"owner"`
	Summary         string                 `json:"summary"`
	AIFocus         string                 `json:"aiFocus"`
	AIContext       map[string]any         `json:"aiContext,omitempty"`
	Metadata        map[string]any         `json:"metadata,omitempty"`
	Documents       []caseDocumentResponse `json:"documents"`
	AssignedLawyers []caseLawyerResponse   `json:"assignedLawyers"`
	Client          *caseClientResponse    `json:"client,omitempty"`
	CreatedAt       time.Time              `json:"createdAt"`
	UpdatedAt       time.Time              `json:"updatedAt"`
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

type caseClientResponse struct {
	ID          uuid.UUID `json:"id"`
	CompanyName string    `json:"companyName"`
	Email       string    `json:"email"`
}

type caseLawyerResponse struct {
	ID          uuid.UUID `json:"id"`
	CompanyName string    `json:"companyName"`
	Email       string    `json:"email"`
	AssignedAt  time.Time `json:"assignedAt"`
	Notes       string    `json:"notes,omitempty"`
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
		cases.POST("/:id/assign", h.handleAssignLawyer)
		cases.POST("/:id/documents", h.handleAttachDocument)
		cases.POST("/:id/documents/upload", h.handleUploadDocument)
		cases.DELETE("/:id/documents/:documentId", h.handleDeleteDocument)
		cases.GET("/:id/documents/:documentId/download", h.handleDownloadDocument)
	}
}

func (h *CaseHandler) handleCreateCase(ctx *gin.Context) {
	_, user, ok := h.auth.requireSession(ctx)
	if !ok {
		return
	}
	if user.Role != models.UserRoleClient {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Only client workspaces can create cases"})
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

	ctx.JSON(http.StatusCreated, toCaseResponse(&caseModel, false))
}

func (h *CaseHandler) handleListCases(ctx *gin.Context) {
	_, user, ok := h.auth.requireSession(ctx)
	if !ok {
		return
	}

	query := h.db.Model(&models.Case{}).
		Preload("Documents").
		Preload("Assignments.Lawyer").
		Preload("User").
		Order("cases.created_at DESC")

	if user.Role == models.UserRoleLawyer {
		query = query.Joins("JOIN case_assignments ON case_assignments.case_id = cases.id").
			Where("case_assignments.lawyer_id = ?", user.ID).
			Distinct("cases.id")
	} else {
		query = query.Where("cases.user_id = ?", user.ID)
	}

	var cases []models.Case
	if err := query.Find(&cases).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to fetch cases"})
		return
	}

	payload := make([]caseResponse, 0, len(cases))
	for i := range cases {
		payload = append(payload, toCaseResponse(&cases[i], user.Role == models.UserRoleLawyer))
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

	query := h.db.Model(&models.Case{}).
		Preload("Documents").
		Preload("Assignments.Lawyer").
		Preload("User").
		Where("cases.id = ?", caseID)

	if user.Role == models.UserRoleLawyer {
		query = query.Joins("JOIN case_assignments ON case_assignments.case_id = cases.id").
			Where("case_assignments.lawyer_id = ?", user.ID)
	} else {
		query = query.Where("cases.user_id = ?", user.ID)
	}

	var caseModel models.Case
	if err := query.First(&caseModel).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Case not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to fetch case"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"case": toCaseResponse(&caseModel, user.Role == models.UserRoleLawyer)})
}

func (h *CaseHandler) handleDeleteCase(ctx *gin.Context) {
	_, user, ok := h.auth.requireSession(ctx)
	if !ok {
		return
	}
	if user.Role != models.UserRoleClient {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Only client workspaces can delete cases"})
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

func (h *CaseHandler) handleAssignLawyer(ctx *gin.Context) {
	_, user, ok := h.auth.requireSession(ctx)
	if !ok {
		return
	}
	if user.Role != models.UserRoleClient {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Only client workspaces can assign lawyers"})
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

	var req assignLawyerRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid assignment payload"})
		return
	}

	lawyerID, err := uuid.Parse(strings.TrimSpace(req.LawyerID))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid lawyer id"})
		return
	}

	var lawyer models.User
	if err := h.db.Where("id = ? AND role = ?", lawyerID, models.UserRoleLawyer).First(&lawyer).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Lawyer not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to fetch lawyer"})
		return
	}

	notes := strings.TrimSpace(req.Notes)
	var assignment models.CaseAssignment
	err = h.db.Where("case_id = ? AND lawyer_id = ?", caseID, lawyerID).First(&assignment).Error

	created := false
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			created = true
			assignment = models.CaseAssignment{
				CaseID:   caseID,
				LawyerID: lawyerID,
				Notes:    notes,
			}
			if err := h.db.Create(&assignment).Error; err != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to assign lawyer"})
				return
			}
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to assign lawyer"})
			return
		}
	} else if notes != assignment.Notes {
		assignment.Notes = notes
		if err := h.db.Save(&assignment).Error; err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update assignment"})
			return
		}
	}

	assignment.Lawyer = lawyer

	resp := caseLawyerResponse{
		ID:          lawyer.ID,
		CompanyName: lawyer.CompanyName,
		Email:       lawyer.Email,
		AssignedAt:  assignment.CreatedAt,
		Notes:       assignment.Notes,
	}

	status := http.StatusCreated
	if !created {
		status = http.StatusOK
	}

	ctx.JSON(status, gin.H{"assignment": resp})
}

func (h *CaseHandler) handleAttachDocument(ctx *gin.Context) {
	_, user, ok := h.auth.requireSession(ctx)
	if !ok {
		return
	}
	if user.Role != models.UserRoleClient {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Only client workspaces can attach documents"})
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

	ctx.JSON(http.StatusCreated, gin.H{"document": h.toDocumentResponse(&document)})
}

func (h *CaseHandler) handleDeleteDocument(ctx *gin.Context) {
	_, user, ok := h.auth.requireSession(ctx)
	if !ok {
		return
	}
	if user.Role != models.UserRoleClient {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Only client workspaces can delete documents"})
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

	var document models.CaseDocument
	if err := h.db.Where("id = ? AND case_id = ?", documentID, caseID).First(&document).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to load document"})
		return
	}

	if err := h.db.Delete(&document).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to delete document"})
		return
	}

	if document.FilePath != "" {
		_ = os.Remove(document.FilePath)
	}

	ctx.Status(http.StatusNoContent)
}

func (h *CaseHandler) handleUploadDocument(ctx *gin.Context) {
	_, user, ok := h.auth.requireSession(ctx)
	if !ok {
		return
	}
	if user.Role != models.UserRoleClient {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Only client workspaces can upload documents"})
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

	fileHeader, err := ctx.FormFile("file")
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}
	if fileHeader.Size == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "File is empty"})
		return
	}

	caseDir := filepath.Join(h.uploadDir, caseID.String())
	if err := os.MkdirAll(caseDir, 0o775); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to prepare storage"})
		return
	}

	safeName := sanitizeFilename(fileHeader.Filename)
	filename := fmt.Sprintf("%s_%s", time.Now().UTC().Format("20060102T150405"), safeName)
	destination := filepath.Join(caseDir, filename)

	if err := ctx.SaveUploadedFile(fileHeader, destination); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save file"})
		return
	}

	category := defaultString(ctx.PostForm("category"), "case")
	document := models.CaseDocument{
		CaseID:      caseID,
		Title:       fileHeader.Filename,
		Owner:       strings.TrimSpace(ctx.PostForm("owner")),
		Description: strings.TrimSpace(ctx.PostForm("description")),
		Status:      strings.TrimSpace(ctx.PostForm("status")),
		Category:    strings.ToLower(strings.TrimSpace(category)),
		FilePath:    destination,
	}
	if document.Category == "" {
		document.Category = "case"
	}

	if err := h.db.Create(&document).Error; err != nil {
		_ = os.Remove(destination)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to persist document"})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"document": h.toDocumentResponse(&document)})
}

func (h *CaseHandler) handleDownloadDocument(ctx *gin.Context) {
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

	var document models.CaseDocument
	switch user.Role {
	case models.UserRoleClient:
		if err := h.ensureCaseBelongsToUser(caseID, user.ID); err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				ctx.JSON(http.StatusNotFound, gin.H{"error": "Case not found"})
				return
			}
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to validate case"})
			return
		}
		if err := h.db.Where("id = ? AND case_id = ?", documentID, caseID).First(&document).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				ctx.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
				return
			}
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to load document"})
			return
		}
	case models.UserRoleLawyer:
		if err := h.ensureCaseAssignedToLawyer(caseID, user.ID); err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				ctx.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
				return
			}
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to validate case"})
			return
		}
		if err := h.db.Where("id = ? AND case_id = ?", documentID, caseID).First(&document).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				ctx.JSON(http.StatusNotFound, gin.H{"error": "Document not found"})
				return
			}
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to load document"})
			return
		}
	default:
		ctx.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized"})
		return
	}

	if document.FilePath == "" {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Document not available for download"})
		return
	}

	if _, err := os.Stat(document.FilePath); err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Document missing from storage"})
		return
	}

	ctx.FileAttachment(document.FilePath, sanitizeFilename(document.Title))
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

func toCaseResponse(model *models.Case, includeClient bool) caseResponse {
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
			docs = append(docs, h.toDocumentResponse(&doc))
		}
		resp.Documents = docs
	} else {
		resp.Documents = []caseDocumentResponse{}
	}

	assignments := make([]caseLawyerResponse, 0, len(model.Assignments))
	for i := range model.Assignments {
		assignment := model.Assignments[i]
		if assignment.Lawyer.ID == uuid.Nil {
			continue
		}
		assignments = append(assignments, caseLawyerResponse{
			ID:          assignment.Lawyer.ID,
			CompanyName: assignment.Lawyer.CompanyName,
			Email:       assignment.Lawyer.Email,
			AssignedAt:  assignment.CreatedAt,
			Notes:       assignment.Notes,
		})
	}
	if assignments == nil {
		assignments = []caseLawyerResponse{}
	}
	resp.AssignedLawyers = assignments

	if includeClient && model.User.ID != uuid.Nil {
		resp.Client = &caseClientResponse{
			ID:          model.User.ID,
			CompanyName: model.User.CompanyName,
			Email:       model.User.Email,
		}
	}

	return resp
}

func (h *CaseHandler) toDocumentResponse(doc *models.CaseDocument) caseDocumentResponse {
	downloadPath := doc.StoragePath
	if doc.FilePath != "" {
		downloadPath = h.documentDownloadPath(doc.CaseID, doc.ID)
	}

	return caseDocumentResponse{
		ID:          doc.ID,
		CaseID:      doc.CaseID,
		Name:        doc.Title,
		Owner:       doc.Owner,
		Description: doc.Description,
		Status:      doc.Status,
		Category:    doc.Category,
		StoragePath: downloadPath,
		CreatedAt:   doc.CreatedAt,
		UpdatedAt:   doc.UpdatedAt,
	}
}

func (h *CaseHandler) documentDownloadPath(caseID, documentID uuid.UUID) string {
	return fmt.Sprintf("/api/v1/cases/%s/documents/%s/download", caseID.String(), documentID.String())
}

func (h *CaseHandler) ensureCaseAssignedToLawyer(caseID, lawyerID uuid.UUID) error {
	var count int64
	if err := h.db.Model(&models.CaseAssignment{}).Where("case_id = ? AND lawyer_id = ?", caseID, lawyerID).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func sanitizeFilename(name string) string {
	base := filepath.Base(strings.TrimSpace(name))
	if base == "" || base == "." {
		return fmt.Sprintf("upload-%d", time.Now().Unix())
	}

	var builder strings.Builder
	for _, r := range base {
		switch {
		case r >= 'a' && r <= 'z', r >= 'A' && r <= 'Z', r >= '0' && r <= '9', r == '.', r == '-', r == '_':
			builder.WriteRune(r)
		case r == ' ':
			builder.WriteRune('_')
		}
	}

	if builder.Len() == 0 {
		return fmt.Sprintf("upload-%d", time.Now().Unix())
	}

	return builder.String()
}

func defaultString(value, fallback string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return fallback
	}
	return value
}
