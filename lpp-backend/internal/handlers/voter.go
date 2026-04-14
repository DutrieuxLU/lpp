package handlers

import (
	"net/http"
	"strconv"

	"lpp-backend/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterVoterRoutes(group *gin.RouterGroup, db *gorm.DB) {
	voterHandler := NewVoterHandler(db)

	group.GET("/voters", voterHandler.GetVoters)
	group.PUT("/voters/:id", voterHandler.UpdateVoter)
	group.DELETE("/voters/:id", voterHandler.DeleteVoter)
}

type VoterHandler struct {
	db *gorm.DB
}

func NewVoterHandler(db *gorm.DB) *VoterHandler {
	return &VoterHandler{db: db}
}

func (h *VoterHandler) GetVoters(c *gin.Context) {
	var voters []models.Voter
	if err := h.db.Order("created_at DESC").Find(&voters).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	type VoterResponse struct {
		ID        uint   `json:"id"`
		Name      string `json:"name"`
		Email     string `json:"email"`
		Username  string `json:"username"`
		Role      string `json:"role"`
		Region    string `json:"region"`
		IsActive  bool   `json:"isActive"`
		Outlet    string `json:"outlet"`
		CreatedAt string `json:"createdAt"`
	}

	var result []VoterResponse
	for _, v := range voters {
		result = append(result, VoterResponse{
			ID:        v.ID,
			Name:      v.Name,
			Email:     v.Email,
			Username:  v.Username,
			Role:      string(v.Role),
			Region:    string(v.Region),
			IsActive:  v.IsActive,
			Outlet:    v.Outlet,
			CreatedAt: v.CreatedAt.Format("2006-01-02"),
		})
	}

	c.JSON(http.StatusOK, result)
}

func (h *VoterHandler) UpdateVoter(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid voter ID"})
		return
	}

	var voter models.Voter
	if err := h.db.First(&voter, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Voter not found"})
		return
	}

	var req struct {
		Role     string `json:"role"`
		IsActive *bool  `json:"isActive"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Role != "" {
		voter.Role = models.Role(req.Role)
	}
	if req.IsActive != nil {
		voter.IsActive = *req.IsActive
	}

	if err := h.db.Save(&voter).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Voter updated", "voter": voter})
}

func (h *VoterHandler) DeleteVoter(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid voter ID"})
		return
	}

	if err := h.db.Delete(&models.Voter{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Voter deleted"})
}
