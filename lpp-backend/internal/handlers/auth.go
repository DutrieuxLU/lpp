package handlers

import (
	"net/http"

	"lpp-backend/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterAuthRoutes(group *gin.RouterGroup, db *gorm.DB) {
	authHandler := NewAuthHandler(db)

	group.POST("/auth/login", authHandler.Login)
}

type AuthHandler struct {
	db *gorm.DB
}

func NewAuthHandler(db *gorm.DB) *AuthHandler {
	return &AuthHandler{db: db}
}

func (h *AuthHandler) Login(c *gin.Context) {
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

	if req.Password != "password123" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"voter": gin.H{
			"id":     voter.ID,
			"name":   voter.Name,
			"email":  voter.Email,
			"region": voter.Region,
		},
		"token": "simple-token-" + string(rune(voter.ID)),
	})
}
