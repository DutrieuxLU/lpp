package handlers

import (
	"net/http"

	"lpp-backend/internal/models"
	"lpp-backend/internal/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRankingRoutes(group *gin.RouterGroup, db *gorm.DB) {
	rankingHandler := NewRankingHandler(db)

	group.GET("/rankings/current", rankingHandler.GetCurrentRankings)
	group.GET("/rankings/week/:weekId", rankingHandler.GetWeekRankings)
	group.POST("/rankings/calculate", rankingHandler.CalculateRankings)
}

type RankingHandler struct {
	db *gorm.DB
}

func NewRankingHandler(db *gorm.DB) *RankingHandler {
	return &RankingHandler{db: db}
}

func (h *RankingHandler) GetCurrentRankings(c *gin.Context) {
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

	c.JSON(http.StatusOK, gin.H{"rankings": rankings})
}
