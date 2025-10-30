package handlers

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"lexiflow/backend/internal/models"
)

type AuthHandler struct {
	db *gorm.DB
}

const (
	sessionCookieName       = "lexiflow_session"
	sessionInactivityWindow = 10 * time.Minute
	sessionAbsoluteTTL      = 24 * time.Hour
	verificationCodeTTL     = 15 * time.Minute
)

type registerRequest struct {
	CompanyName string `json:"companyName" binding:"required"`
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required,min=8"`
	Plan        string `json:"plan"`
	Role        string `json:"role"`
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
	Plan string `json:"plan" binding:"required"`
}

type resendVerificationRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type userResponse struct {
	ID           uuid.UUID `json:"id"`
	CompanyName  string    `json:"companyName"`
	Email        string    `json:"email"`
	Verified     bool      `json:"verified"`
	Subscription string    `json:"subscription"`
	Role         string    `json:"role"`
	CreatedAt    string    `json:"createdAt"`
	Role         string    `json:"role"`
}

type authSuccessResponse struct {
	User             userResponse `json:"user"`
	SessionExpiresAt string       `json:"sessionExpiresAt"`
	SessionToken     string       `json:"sessionToken,omitempty"`
}

type registerSuccessResponse struct {
	User             userResponse `json:"user"`
	VerificationCode string       `json:"verificationCode,omitempty"`
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
		auth.POST("/verify-email/resend", h.handleResendVerification)
		auth.POST("/subscription", h.handleUpdateSubscription)
		auth.GET("/me", h.handleCurrentUser)
		auth.POST("/logout", h.handleLogout)
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

	role := strings.TrimSpace(strings.ToLower(req.Role))
	if role == "" {
		role = models.UserRoleClient
	}
	if role != models.UserRoleClient && role != models.UserRoleLawyer {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported role"})
		return
	}

	user := models.User{
		CompanyName:  req.CompanyName,
		Email:        email,
		PasswordHash: string(hash),
		Subscription: subscription,
		Role:         role,
	}

	if err := h.db.Create(&user).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to persist account"})
		return
	}

	code, err := h.issueVerificationCode(&user)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to generate verification code"})
		return
	}

	ctx.JSON(http.StatusCreated, registerSuccessResponse{
		User:             toUserResponse(&user),
		VerificationCode: code,
	})
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

	if !user.Verified {
		code, err := h.issueVerificationCode(&user)
		if err != nil {
			ctx.JSON(http.StatusForbidden, gin.H{"error": "Email not verified"})
			return
		}
		ctx.JSON(http.StatusForbidden, gin.H{
			"error":             "Email not verified",
			"verificationCode":  code,
			"verificationValid": int(verificationCodeTTL.Minutes()),
		})
		return
	}

	session, err := h.createSession(ctx, &user)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create session"})
		return
	}

	setSessionCookie(ctx, session.Token)

	ctx.JSON(http.StatusOK, authSuccessResponse{
		User:             toUserResponse(&user),
		SessionExpiresAt: session.ExpiresAt.UTC().Format(time.RFC3339),
		SessionToken:     session.Token,
	})
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

	var token models.VerificationToken
	if err := h.db.Where("user_id = ? AND code = ?", user.ID, req.Code).First(&token).Error; err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid verification code"})
		return
	}

	now := time.Now().UTC()
	if now.After(token.ExpiresAt) {
		_ = h.db.Delete(&token).Error
		code, err := h.issueVerificationCode(&user)
		if err != nil {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Verification code expired"})
			return
		}
		ctx.JSON(http.StatusUnauthorized, gin.H{
			"error":             "Verification code expired",
			"verificationCode":  code,
			"verificationValid": int(verificationCodeTTL.Minutes()),
		})
		return
	}

	if !user.Verified {
		user.Verified = true
		if err := h.db.Save(&user).Error; err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update verification"})
			return
		}
	}

	_ = h.db.Where("user_id = ?", user.ID).Delete(&models.VerificationToken{}).Error

	ctx.JSON(http.StatusOK, gin.H{"user": toUserResponse(&user)})
}

func (h *AuthHandler) handleUpdateSubscription(ctx *gin.Context) {
	session, user, ok := h.requireSession(ctx)
	if !ok {
		return
	}

	var req subscriptionRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid subscription payload"})
		return
	}

	if req.Plan == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Plan is required"})
		return
	}

	user.Subscription = req.Plan
	if err := h.db.Save(user).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update subscription"})
		return
	}

	ctx.JSON(http.StatusOK, authSuccessResponse{
		User:             toUserResponse(user),
		SessionExpiresAt: session.ExpiresAt.UTC().Format(time.RFC3339),
		SessionToken:     session.Token,
	})
}

func (h *AuthHandler) handleResendVerification(ctx *gin.Context) {
	var req resendVerificationRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid verification request"})
		return
	}

	email := strings.ToLower(req.Email)
	var user models.User
	if err := h.db.Where("email = ?", email).First(&user).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Account not found"})
		return
	}

	if user.Verified {
		ctx.JSON(http.StatusOK, registerSuccessResponse{
			User: toUserResponse(&user),
		})
		return
	}

	code, err := h.issueVerificationCode(&user)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to generate verification code"})
		return
	}

	ctx.JSON(http.StatusOK, registerSuccessResponse{
		User:             toUserResponse(&user),
		VerificationCode: code,
	})
}

func (h *AuthHandler) handleCurrentUser(ctx *gin.Context) {
	session, user, ok := h.requireSession(ctx)
	if !ok {
		return
	}

	ctx.JSON(http.StatusOK, authSuccessResponse{
		User:             toUserResponse(user),
		SessionExpiresAt: session.ExpiresAt.UTC().Format(time.RFC3339),
		SessionToken:     session.Token,
	})
}

func (h *AuthHandler) handleLogout(ctx *gin.Context) {
	token := extractSessionToken(ctx)
	if token != "" {
		h.db.Where("token = ?", token).Delete(&models.Session{})
	}
	clearSessionCookie(ctx)
	ctx.JSON(http.StatusOK, gin.H{"status": "logged out"})
}

func toUserResponse(user *models.User) userResponse {
	return userResponse{
		ID:           user.ID,
		CompanyName:  user.CompanyName,
		Email:        user.Email,
		Verified:     user.Verified,
		Subscription: user.Subscription,
		Role:         user.Role,
		CreatedAt:    user.CreatedAt.UTC().Format(time.RFC3339),
		Role:         user.Role,
	}
}

func (h *AuthHandler) issueVerificationCode(user *models.User) (string, error) {
	code, err := generateVerificationCode()
	if err != nil {
		return "", err
	}

	if err := h.db.Where("user_id = ?", user.ID).Delete(&models.VerificationToken{}).Error; err != nil {
		return "", err
	}

	token := models.VerificationToken{
		UserID:    user.ID,
		Code:      code,
		ExpiresAt: time.Now().UTC().Add(verificationCodeTTL),
	}

	if err := h.db.Create(&token).Error; err != nil {
		return "", err
	}

	return code, nil
}

func (h *AuthHandler) createSession(ctx *gin.Context, user *models.User) (*models.Session, error) {
	now := time.Now().UTC()
	// Clean up stale sessions opportunistically.
	_ = h.db.Where("expires_at < ?", now).Delete(&models.Session{}).Error

	token, err := generateSessionToken()
	if err != nil {
		return nil, err
	}

	userAgent := truncateString(ctx.GetHeader("User-Agent"), 255)
	ip := truncateString(ctx.ClientIP(), 64)

	session := models.Session{
		UserID:       user.ID,
		Token:        token,
		UserAgent:    userAgent,
		IP:           ip,
		LastActivity: now,
		ExpiresAt:    now.Add(sessionInactivityWindow),
	}

	if sessionAbsoluteTTL > 0 {
		absoluteExpiry := now.Add(sessionAbsoluteTTL)
		if session.ExpiresAt.After(absoluteExpiry) {
			session.ExpiresAt = absoluteExpiry
		}
	}

	if err := h.db.Create(&session).Error; err != nil {
		return nil, err
	}

	return &session, nil
}

func (h *AuthHandler) requireSession(ctx *gin.Context) (*models.Session, *models.User, bool) {
	token := extractSessionToken(ctx)
	if token == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return nil, nil, false
	}

	var session models.Session
	if err := h.db.Preload("User").Where("token = ?", token).First(&session).Error; err != nil {
		clearSessionCookie(ctx)
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Session expired"})
		return nil, nil, false
	}

	now := time.Now().UTC()
	if now.After(session.ExpiresAt) ||
		now.Sub(session.LastActivity) > sessionInactivityWindow ||
		(sessionAbsoluteTTL > 0 && now.Sub(session.CreatedAt) > sessionAbsoluteTTL) {
		_ = h.db.Delete(&session).Error
		clearSessionCookie(ctx)
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Session expired"})
		return nil, nil, false
	}

	newExpiry := now.Add(sessionInactivityWindow)
	if sessionAbsoluteTTL > 0 {
		absoluteExpiry := session.CreatedAt.Add(sessionAbsoluteTTL)
		if newExpiry.After(absoluteExpiry) {
			newExpiry = absoluteExpiry
		}
	}

	session.LastActivity = now
	session.ExpiresAt = newExpiry
	if err := h.db.Model(&session).Updates(map[string]interface{}{
		"last_activity": session.LastActivity,
		"expires_at":    session.ExpiresAt,
	}).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to refresh session"})
		return nil, nil, false
	}

	setSessionCookie(ctx, session.Token)
	return &session, &session.User, true
}

func extractSessionToken(ctx *gin.Context) string {
	if header := ctx.GetHeader("Authorization"); strings.HasPrefix(strings.ToLower(header), "bearer ") {
		return strings.TrimSpace(header[7:])
	}

	if cookie, err := ctx.Cookie(sessionCookieName); err == nil {
		return cookie
	}

	return ""
}

func setSessionCookie(ctx *gin.Context, token string) {
	ctx.SetCookie(sessionCookieName, token, int(sessionInactivityWindow.Seconds()), "/", "", false, true)
}

func clearSessionCookie(ctx *gin.Context) {
	ctx.SetCookie(sessionCookieName, "", -1, "/", "", false, true)
}

func generateSessionToken() (string, error) {
	buff := make([]byte, 32)
	if _, err := rand.Read(buff); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buff), nil
}

func generateVerificationCode() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

func truncateString(value string, max int) string {
	runes := []rune(value)
	if len(runes) <= max {
		return value
	}
	return string(runes[:max])
}
