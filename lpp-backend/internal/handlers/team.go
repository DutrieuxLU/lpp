package handlers

import (
	"net/http"

	"lpp-backend/internal/models"
	"lpp-backend/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterTeamRoutes(group *gin.RouterGroup, db *gorm.DB) {
	teamHandler := NewTeamHandler(db)

	group.GET("/teams", teamHandler.GetTeams)
	group.GET("/teams/:id", teamHandler.GetTeam)
	group.POST("/teams", teamHandler.CreateTeam)
	group.PUT("/teams/:id", teamHandler.UpdateTeam)
	group.DELETE("/teams/:id", teamHandler.DeleteTeam)
	group.POST("/teams/sync", teamHandler.SyncTeams)
}

type TeamHandler struct {
	db *gorm.DB
}

func NewTeamHandler(db *gorm.DB) *TeamHandler {
	return &TeamHandler{db: db}
}

func (h *TeamHandler) GetTeams(c *gin.Context) {
	var teams []models.Team
	query := h.db

	if region := c.Query("region"); region != "" {
		query = query.Where("region = ?", region)
	}

	if err := query.Order("name ASC").Find(&teams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, teams)
}

func (h *TeamHandler) GetTeam(c *gin.Context) {
	id := c.Param("id")
	var team models.Team
	if err := h.db.First(&team, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Team not found"})
		return
	}
	c.JSON(http.StatusOK, team)
}

func (h *TeamHandler) CreateTeam(c *gin.Context) {
	var team models.Team
	if err := c.ShouldBindJSON(&team); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.db.Create(&team).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, team)
}

func (h *TeamHandler) UpdateTeam(c *gin.Context) {
	id := c.Param("id")
	var team models.Team
	if err := h.db.First(&team, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Team not found"})
		return
	}

	var update models.Team
	if err := c.ShouldBindJSON(&update); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	team.Name = update.Name
	team.ShortName = update.ShortName
	team.Region = update.Region
	team.Logo = update.Logo
	team.ExternalID = update.ExternalID

	if err := h.db.Save(&team).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, team)
}

func (h *TeamHandler) DeleteTeam(c *gin.Context) {
	id := c.Param("id")
	if err := h.db.Delete(&models.Team{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Team deleted"})
}

func (h *TeamHandler) SyncTeams(c *gin.Context) {
	svc := services.NewTeamSyncService(h.db)
	created, updated, err := svc.SyncTeams()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"created": created, "updated": updated})
}
