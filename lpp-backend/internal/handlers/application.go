package handlers

import (
	"net/http"

	"lpp-backend/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterApplicationRoutes(group *gin.RouterGroup, db *gorm.DB) {
	appHandler := NewApplicationHandler(db)

	group.POST("/applications", appHandler.CreateApplication)
	group.GET("/applications", appHandler.GetApplications)
	group.PUT("/applications/:id/approve", appHandler.ApproveApplication)
	group.PUT("/applications/:id/reject", appHandler.RejectApplication)
}

type ApplicationHandler struct {
	db *gorm.DB
}

func NewApplicationHandler(db *gorm.DB) *ApplicationHandler {
	return &ApplicationHandler{db: db}
}

func (h *ApplicationHandler) CreateApplication(c *gin.Context) {
	var req struct {
		Name   string `json:"name" binding:"required"`
		Email  string `json:"email" binding:"required"`
		Outlet string `json:"outlet"`
		Region string `json:"region"`
		Notes  string `json:"notes"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name and email required"})
		return
	}

	app := models.Application{
		Name:   req.Name,
		Email:  req.Email,
		Outlet: req.Outlet,
		Region: models.Region(req.Region),
		Notes:  req.Notes,
		Status: models.ApplicationStatusPending,
	}
	if err := h.db.Create(&app).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Application submitted", "id": app.ID})
}

func (h *ApplicationHandler) GetApplications(c *gin.Context) {
	var apps []models.Application
	if err := h.db.Where("status = ?", models.ApplicationStatusPending).Find(&apps).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, apps)
}

func (h *ApplicationHandler) ApproveApplication(c *gin.Context) {
	id := c.Param("id")
	var app models.Application
	if err := h.db.First(&app, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
		return
	}

	app.Status = models.ApplicationStatusApproved
	if err := h.db.Save(&app).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	voter := models.Voter{
		Name:     app.Name,
		Outlet:   app.Outlet,
		Email:    app.Email,
		Password: "password123",
		Role:     models.RolePollster,
		Region:   app.Region,
		IsActive: true,
	}
	h.db.Create(&voter)

	c.JSON(http.StatusOK, gin.H{"message": "Application approved", "voterId": voter.ID})
}

func (h *ApplicationHandler) RejectApplication(c *gin.Context) {
	id := c.Param("id")
	var app models.Application
	if err := h.db.First(&app, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Application not found"})
		return
	}

	app.Status = models.ApplicationStatusRejected
	h.db.Save(&app)

	c.JSON(http.StatusOK, gin.H{"message": "Application rejected"})
}
