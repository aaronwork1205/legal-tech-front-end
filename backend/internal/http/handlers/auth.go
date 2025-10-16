package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"lexiflow/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db *gorm.DB
}

type registerRequest struct {
	CompanyName string `json:"companyName" binding:"required"`
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required,min=8"`
	Plan        string `json:"plan"`
}

type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type verifyRequest struct {
	Email string `json:"email" binding:"required,email"`
	Code  string `json:"code" binding:"required"`
}

type subscriptionRequest struct {
	Email string `json:"email" binding:"required,email"`
	Plan  string `json:"plan" binding:"required"`
}

type userResponse struct {
	ID           uuid.UUID `json:"id"`
	CompanyName  string    `json:"companyName"`
	Email        string    `json:"email"`
	Verified     bool      `json:"verified"`
	Subscription string    `json:"subscription"`
	CreatedAt    string    `json:"createdAt"`
}

func NewAuthHandler(db *gorm.DB) *AuthHandler {
	return &AuthHandler{db: db}
}

func (h *AuthHandler) RegisterRoutes(router *gin.RouterGroup) {
	auth := router.Group("/auth")
	{
		auth.POST("/register", h.handleRegister)
		auth.POST("/login", h.handleLogin)
		auth.POST("/verify-email", h.handleVerifyEmail)
		auth.POST("/subscription", h.handleUpdateSubscription)
	}
}

func (h *AuthHandler) handleRegister(ctx *gin.Context) {
	var req registerRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid registration payload"})
		return
	}

	email := strings.ToLower(req.Email)
	var existing models.User
	if err := h.db.Where("email = ?", email).First(&existing).Error; err == nil {
		ctx.JSON(http.StatusConflict, gin.H{"error": "Account already exists"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to register account"})
		return
	}

	subscription := req.Plan
	if subscription == "" {
		subscription = "starter"
	}

	user := models.User{
		CompanyName:  req.CompanyName,
		Email:        email,
		PasswordHash: string(hash),
		Subscription: subscription,
	}

	if err := h.db.Create(&user).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to persist account"})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"user": toUserResponse(&user)})
}

func (h *AuthHandler) handleLogin(ctx *gin.Context) {
	var req loginRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid login payload"})
		return
	}

	email := strings.ToLower(req.Email)
	var user models.User
	if err := h.db.Where("email = ?", email).First(&user).Error; err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Incorrect email or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Incorrect email or password"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"user": toUserResponse(&user)})
}

func (h *AuthHandler) handleVerifyEmail(ctx *gin.Context) {
	var req verifyRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid verify payload"})
		return
	}

	email := strings.ToLower(req.Email)
	var user models.User
	if err := h.db.Where("email = ?", email).First(&user).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	if !user.Verified {
		user.Verified = true
		if err := h.db.Save(&user).Error; err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update verification"})
			return
		}
	}

	ctx.JSON(http.StatusOK, gin.H{"user": toUserResponse(&user)})
}

func (h *AuthHandler) handleUpdateSubscription(ctx *gin.Context) {
	var req subscriptionRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid subscription payload"})
		return
	}

	email := strings.ToLower(req.Email)
	var user models.User
	if err := h.db.Where("email = ?", email).First(&user).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	user.Subscription = req.Plan
	if err := h.db.Save(&user).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update subscription"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"user": toUserResponse(&user)})
}

func toUserResponse(user *models.User) userResponse {
	return userResponse{
		ID:           user.ID,
		CompanyName:  user.CompanyName,
		Email:        user.Email,
		Verified:     user.Verified,
		Subscription: user.Subscription,
		CreatedAt:    user.CreatedAt.UTC().Format(time.RFC3339),
	}
}
