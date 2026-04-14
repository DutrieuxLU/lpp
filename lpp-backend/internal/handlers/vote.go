package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"lpp-backend/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterVoteRoutes(group *gin.RouterGroup, db *gorm.DB) {
	voteHandler := NewVoteHandler(db)

	group.GET("/votes/week/:weekId", voteHandler.GetVotesByWeek)
	group.POST("/votes", voteHandler.SubmitVote)
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
	var req struct {
		PollWeekID uint          `json:"pollWeekId" binding:"required"`
		VoterID    uint          `json:"voterId" binding:"required"`
		Rankings   []TeamRanking `json:"rankings" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	rankingsJSON, _ := json.Marshal(req.Rankings)

	vote := models.Vote{
		PollWeekID:  req.PollWeekID,
		VoterID:     req.VoterID,
		Rankings:    string(rankingsJSON),
		SubmittedAt: time.Now(),
	}

	if err := h.db.Create(&vote).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, vote)
}
