package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"

	"lpp-backend/internal/config"
	"lpp-backend/internal/email"
	"lpp-backend/internal/models"
	"lpp-backend/internal/security"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterAuthRoutes(group *gin.RouterGroup, db *gorm.DB, cfg *config.Config) {
	emailSvc := email.NewEmailService(cfg.ResendAPIKey, cfg.ResendFromEmail)
	authHandler := NewAuthHandler(db, cfg, emailSvc)

	group.POST("/register", authHandler.Register)
	group.POST("/login", authHandler.Login)
	group.POST("/verify-2fa", authHandler.Verify2FA)
	group.POST("/refresh", authHandler.Refresh)
	group.POST("/logout", authHandler.Logout)
}

type AuthHandler struct {
	db       *gorm.DB
	cfg      *config.Config
	emailSvc *email.EmailService
}

func NewAuthHandler(db *gorm.DB, cfg *config.Config, emailSvc *email.EmailService) *AuthHandler {
	return &AuthHandler{db: db, cfg: cfg, emailSvc: emailSvc}
}

func (h *AuthHandler) Register(c *gin.Context) {
	if h.cfg.TurnstileSecret != "" {
		var tokenReq struct {
			TurnstileToken string `json:"turnstileToken"`
		}
		if err := c.ShouldBindJSON(&tokenReq); err == nil && tokenReq.TurnstileToken != "" && tokenReq.TurnstileToken != "dev-bypass" {
			valid, err := security.VerifyTurnstile(tokenReq.TurnstileToken, h.cfg.TurnstileSecret)
			if err != nil || !valid {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Turnstile verification failed"})
				return
			}
		}
	}

	var req struct {
		Name     string `json:"name" binding:"required"`
		Email    string `json:"email" binding:"required,email"`
		Password string `json:"password" binding:"required,min=8"`
		Username string `json:"username"`
		Outlet   string `json:"outlet"`
		Region   string `json:"region"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	var existing models.Voter
	if err := h.db.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already registered"})
		return
	}

	hashedPassword, err := security.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	username := req.Username
	if username == "" {
		username = req.Email
	}

	voter := models.Voter{
		Name:     req.Name,
		Email:    req.Email,
		Password: hashedPassword,
		Username: username,
		Outlet:   req.Outlet,
		Role:     models.RoleGeneral,
		IsActive: true,
	}
	if req.Region != "" {
		voter.Region = models.Region(req.Region)
	}

	if err := h.db.Create(&voter).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create voter"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Registration successful", "voterId": voter.ID})
}

func (h *AuthHandler) Login(c *gin.Context) {
	if h.cfg.TurnstileSecret != "" {
		var tokenReq struct {
			TurnstileToken string `json:"turnstileToken"`
		}
		if err := c.ShouldBindJSON(&tokenReq); err == nil && tokenReq.TurnstileToken != "" && tokenReq.TurnstileToken != "dev-bypass" {
			valid, err := security.VerifyTurnstile(tokenReq.TurnstileToken, h.cfg.TurnstileSecret)
			if err != nil || !valid {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Turnstile verification failed"})
				return
			}
		}
	}

	var req struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email and password required"})
		return
	}

	var voter models.Voter
	if err := h.db.Where("email = ?", req.Email).First(&voter).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	valid, err := security.VerifyPassword(req.Password, voter.Password)
	if err != nil || !valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if !voter.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account is not active"})
		return
	}

	code := generateCode(6)
	expiresAt := time.Now().Add(2 * time.Minute)

	h.db.Where("email = ?", req.Email).Delete(&models.EmailCode{})

	emailCode := models.EmailCode{
		Email:     req.Email,
		Code:      code,
		ExpiresAt: expiresAt,
		Used:      false,
	}
	if err := h.db.Create(&emailCode).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create verification code"})
		return
	}

	go h.emailSvc.SendVerificationCode(req.Email, code)

	tempToken, err := security.SignToken(h.cfg.JWTSecret, voter.ID, voter.Email, string(voter.Role), voter.Username, 5*time.Minute)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate temp token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"require2FA": true,
		"tempToken":  tempToken,
		"message":    "Verification code sent to your email",
	})
}

func (h *AuthHandler) Verify2FA(c *gin.Context) {
	var req struct {
		TempToken string `json:"tempToken" binding:"required"`
		Code      string `json:"code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Temp token and code required"})
		return
	}

	claims, err := security.ParseToken(h.cfg.JWTSecret, req.TempToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired temp token"})
		return
	}

	var emailCode models.EmailCode
	if err := h.db.Where("email = ? AND code = ? AND used = ? AND expires_at > ?", claims.Email, req.Code, false, time.Now()).First(&emailCode).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired verification code"})
		return
	}

	emailCode.Used = true
	h.db.Save(&emailCode)

	var voter models.Voter
	if err := h.db.First(&voter, claims.VoterID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	accessToken, err := security.SignToken(h.cfg.JWTSecret, voter.ID, voter.Email, string(voter.Role), voter.Username, 15*time.Minute)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate access token"})
		return
	}

	refreshToken := generateRefreshToken()
	hashedToken := security.HashToken(refreshToken)
	expiresAt := time.Now().Add(7 * 24 * time.Hour)

	rt := models.RefreshToken{
		VoterID:   voter.ID,
		Token:     hashedToken,
		ExpiresAt: expiresAt,
		Revoked:   false,
	}
	if err := h.db.Create(&rt).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store refresh token"})
		return
	}

	c.SetCookie("access_token", accessToken, 900, "/", "", false, true)
	c.SetCookie("refresh_token", refreshToken, 7*86400, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"voter": gin.H{
			"id":       voter.ID,
			"name":     voter.Name,
			"email":    voter.Email,
			"username": voter.Username,
			"role":     voter.Role,
			"region":   voter.Region,
		},
		"accessToken":  accessToken,
		"refreshToken": refreshToken,
	})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err != nil || refreshToken == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token required"})
		return
	}

	hashedToken := security.HashToken(refreshToken)

	var rt models.RefreshToken
	if err := h.db.Where("token = ? AND revoked = ? AND expires_at > ?", hashedToken, false, time.Now()).First(&rt).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired refresh token"})
		return
	}

	var voter models.Voter
	if err := h.db.First(&voter, rt.VoterID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	if !voter.IsActive {
		c.JSON(http.StatusForbidden, gin.H{"error": "Account is not active"})
		return
	}

	accessToken, err := security.SignToken(h.cfg.JWTSecret, voter.ID, voter.Email, string(voter.Role), voter.Username, 15*time.Minute)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate access token"})
		return
	}

	newRefreshToken := generateRefreshToken()
	newHashedToken := security.HashToken(newRefreshToken)
	expiresAt := time.Now().Add(7 * 24 * time.Hour)

	rt.Revoked = true
	h.db.Model(&rt).Update("revoked", true)

	newRT := models.RefreshToken{
		VoterID:   voter.ID,
		Token:     newHashedToken,
		ExpiresAt: expiresAt,
		Revoked:   false,
	}
	h.db.Create(&newRT)

	c.SetCookie("access_token", accessToken, 900, "/", "", false, true)
	c.SetCookie("refresh_token", newRefreshToken, 7*86400, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{"accessToken": accessToken, "refreshToken": newRefreshToken})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	refreshToken, err := c.Cookie("refresh_token")
	if err == nil && refreshToken != "" {
		hashedToken := security.HashToken(refreshToken)
		h.db.Model(&models.RefreshToken{}).Where("token = ?", hashedToken).Update("revoked", true)
	}

	c.SetCookie("access_token", "", -1, "/", "", false, true)
	c.SetCookie("refresh_token", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{"message": "Logged out"})
}

func generateRefreshToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func generateCode(length int) string {
	b := make([]byte, length)
	for i := range b {
		b[i] = byte(49 + i%9)
	}
	rand.Read(b)
	for i := range b {
		b[i] = byte(48 + int(b[i])%10)
	}
	return string(b)
}
