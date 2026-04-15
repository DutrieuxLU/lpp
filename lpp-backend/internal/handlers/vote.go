package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"lpp-backend/internal/middleware"
	"lpp-backend/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterVoteRoutes(group *gin.RouterGroup, db *gorm.DB, secret string) {
	voteHandler := NewVoteHandler(db)

	publicGroup := group.Group("")
	publicGroup.GET("/votes/week/:weekId", voteHandler.GetVotesByWeek)

	protected := group.Group("")
	protected.Use(middleware.AuthRequired(secret))
	protected.POST("/votes", voteHandler.SubmitVote)
}

type VoteHandler struct {
	db *gorm.DB
}

func NewVoteHandler(db *gorm.DB) *VoteHandler {
	return &VoteHandler{db: db}
}

type TeamRanking struct {
	TeamID     uint   `json:"teamId"`
	Rank       int    `json:"rank"`
	TeamName   string `json:"teamName,omitempty"`
	TeamShort  string `json:"teamShort,omitempty"`
	TeamLogo   string `json:"teamLogo,omitempty"`
	TeamRegion string `json:"teamRegion,omitempty"`
}

func (h *VoteHandler) GetVotesByWeek(c *gin.Context) {
	weekID := c.Param("weekId")

	var votes []models.Vote
	if err := h.db.Where("poll_week_id = ?", weekID).Find(&votes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	type VoteResponse struct {
		ID          uint          `json:"id"`
		PollWeekID  uint          `json:"pollWeekId"`
		VoterID     uint          `json:"voterId"`
		Rankings    []TeamRanking `json:"rankings"`
		SubmittedAt time.Time     `json:"submittedAt"`
	}

	var result []VoteResponse
	for _, v := range votes {
		var rankings []TeamRanking
		json.Unmarshal([]byte(v.Rankings), &rankings)
		result = append(result, VoteResponse{
			ID:          v.ID,
			PollWeekID:  v.PollWeekID,
			VoterID:     v.VoterID,
			Rankings:    rankings,
			SubmittedAt: v.SubmittedAt,
		})
	}

	c.JSON(http.StatusOK, result)
}

func (h *VoteHandler) SubmitVote(c *gin.Context) {
	voterID := middleware.GetVoterID(c)
	if voterID == 0 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	var req struct {
		PollWeekID uint          `json:"pollWeekId" binding:"required"`
		Rankings   []TeamRanking `json:"rankings" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if voter already voted for this poll week
	var existingVote models.Vote
	if err := h.db.Where("poll_week_id = ? AND voter_id = ?", req.PollWeekID, voterID).First(&existingVote).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "You have already voted for this week. Please contact an admin to modify your vote."})
		return
	}

	// Validate rankings
	if len(req.Rankings) != 15 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You must rank exactly 15 teams"})
		return
	}

	// Check for duplicate team IDs
	seenTeams := make(map[uint]bool)
	for _, r := range req.Rankings {
		if r.TeamID == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid team ID in rankings"})
			return
		}
		if seenTeams[r.TeamID] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Duplicate team in rankings: each team can only be ranked once"})
			return
		}
		seenTeams[r.TeamID] = true
	}

	// Check for duplicate ranks
	seenRanks := make(map[int]bool)
	for _, r := range req.Rankings {
		if r.Rank < 1 || r.Rank > 15 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Rank must be between 1 and 15"})
			return
		}
		if seenRanks[r.Rank] {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Duplicate rank value: each rank position can only be used once"})
			return
		}
		seenRanks[r.Rank] = true
	}

	rankingsJSON, _ := json.Marshal(req.Rankings)

	vote := models.Vote{
		PollWeekID:  req.PollWeekID,
		VoterID:     voterID,
		Rankings:    string(rankingsJSON),
		SubmittedAt: time.Now(),
	}

	if err := h.db.Create(&vote).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, vote)
}
