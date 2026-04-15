package handlers

import (
	"net/http"

	"lpp-backend/internal/middleware"
	"lpp-backend/internal/models"
	"lpp-backend/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRankingRoutes(group *gin.RouterGroup, db *gorm.DB, secret string) {
	rankingHandler := NewRankingHandler(db)

	group.GET("/rankings/current", rankingHandler.GetCurrentRankings)
	group.GET("/rankings/week/:weekId", rankingHandler.GetWeekRankings)

	adminGroup := group.Group("")
	adminGroup.Use(middleware.AuthRequired(secret))
	adminGroup.POST("/rankings/calculate", rankingHandler.CalculateRankings)
	adminGroup.DELETE("/rankings/week/:weekId", rankingHandler.ClearRankings)
}

type RankingHandler struct {
	db *gorm.DB
}

func NewRankingHandler(db *gorm.DB) *RankingHandler {
	return &RankingHandler{db: db}
}

func (h *RankingHandler) GetCurrentRankings(c *gin.Context) {
	region := c.Query("region")

	var pollWeek models.PollWeek
	if err := h.db.Where("status = ?", models.PollStatusPublished).
		Order("publish_date DESC").
		First(&pollWeek).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{
			"pollWeek": nil,
			"rankings": []interface{}{},
		})
		return
	}

	query := h.db.Where("poll_week_id = ?", pollWeek.ID)

	if region != "" && region != "global" {
		regionModel := models.Region(region)
		var teamIDs []uint
		h.db.Model(&models.Team{}).Where("region = ?", regionModel).Pluck("id", &teamIDs)
		if len(teamIDs) > 0 {
			query = query.Where("team_id IN ?", teamIDs).Order("points DESC").Limit(5)
		}
	} else {
		query = query.Order("rank ASC").Limit(15)
	}

	var rankings []models.Ranking
	if err := query.Find(&rankings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var teamIDs []uint
	for _, r := range rankings {
		teamIDs = append(teamIDs, r.TeamID)
	}

	var teams []models.Team
	if len(teamIDs) > 0 {
		h.db.Where("id IN ?", teamIDs).Find(&teams)
	}

	teamMap := make(map[uint]models.Team)
	for _, t := range teams {
		teamMap[t.ID] = t
	}

	type RankingWithTeam struct {
		Rank            int         `json:"rank"`
		Points          int         `json:"points"`
		FirstPlaceVotes int         `json:"firstPlaceVotes"`
		Team            models.Team `json:"team"`
	}

	var result []RankingWithTeam
	for _, r := range rankings {
		result = append(result, RankingWithTeam{
			Rank:            r.Rank,
			Points:          r.Points,
			FirstPlaceVotes: r.FirstPlaceVotes,
			Team:            teamMap[r.TeamID],
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"pollWeek": pollWeek,
		"rankings": result,
	})
}

func (h *RankingHandler) GetWeekRankings(c *gin.Context) {
	weekID := c.Param("weekId")
	var pollWeek models.PollWeek
	if err := h.db.First(&pollWeek, weekID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll week not found"})
		return
	}

	var rankings []models.Ranking
	if err := h.db.Where("poll_week_id = ?", pollWeek.ID).
		Order("rank ASC").
		Find(&rankings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var teamIDs []uint
	for _, r := range rankings {
		teamIDs = append(teamIDs, r.TeamID)
	}

	var teams []models.Team
	if len(teamIDs) > 0 {
		h.db.Where("id IN ?", teamIDs).Find(&teams)
	}

	teamMap := make(map[uint]models.Team)
	for _, t := range teams {
		teamMap[t.ID] = t
	}

	type RankingWithTeam struct {
		Rank            int         `json:"rank"`
		Points          int         `json:"points"`
		FirstPlaceVotes int         `json:"firstPlaceVotes"`
		Team            models.Team `json:"team"`
	}

	var result []RankingWithTeam
	for _, r := range rankings {
		result = append(result, RankingWithTeam{
			Rank:            r.Rank,
			Points:          r.Points,
			FirstPlaceVotes: r.FirstPlaceVotes,
			Team:            teamMap[r.TeamID],
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"pollWeek": pollWeek,
		"rankings": result,
	})
}

func (h *RankingHandler) CalculateRankings(c *gin.Context) {
	role := middleware.GetVoterRole(c)
	if role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	var req struct {
		PollWeekID uint `json:"pollWeekId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	rankingService := services.NewRankingService(h.db)
	rankings, err := rankingService.CalculateRankings(req.PollWeekID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var pollWeek models.PollWeek
	if err := h.db.First(&pollWeek, req.PollWeekID).Error; err == nil {
		pollWeek.Status = models.PollStatusPublished
		h.db.Save(&pollWeek)
	}

	c.JSON(http.StatusOK, gin.H{"rankings": rankings})
}

func (h *RankingHandler) ClearRankings(c *gin.Context) {
	role := middleware.GetVoterRole(c)
	if role != string(models.RoleAdmin) {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	weekID := c.Param("weekId")
	var pollWeek models.PollWeek
	if err := h.db.First(&pollWeek, weekID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Poll week not found"})
		return
	}

	if err := h.db.Where("poll_week_id = ?", pollWeek.ID).Delete(&models.Ranking{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	pollWeek.Status = models.PollStatusOpen
	h.db.Save(&pollWeek)

	c.JSON(http.StatusOK, gin.H{"message": "Rankings cleared for week " + weekID})
}
