package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"lpp-backend/internal/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterPollsterRoutes(group *gin.RouterGroup, db *gorm.DB) {
	pollsterHandler := NewPollsterHandler(db)

	group.GET("/pollsters", pollsterHandler.ListPollsters)
	group.GET("/pollsters/:identifier", pollsterHandler.GetPollster)
	group.GET("/pollsters/:identifier/votes", pollsterHandler.GetPollsterVotes)
	group.PUT("/pollsters/profile", pollsterHandler.UpdateProfile)
}

type PollsterHandler struct {
	db *gorm.DB
}

func NewPollsterHandler(db *gorm.DB) *PollsterHandler {
	return &PollsterHandler{db: db}
}

type PollsterProfile struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	Username  string `json:"username"`
	Outlet    string `json:"outlet"`
	Region    string `json:"region"`
	Role      string `json:"role"`
	IsActive  bool   `json:"isActive"`
	Bio       string `json:"bio"`
	Photo     string `json:"photo"`
	CreatedAt string `json:"createdAt"`
}

type PollsterResponse struct {
	Pollster   PollsterProfile `json:"pollster"`
	LatestVote *VoteWithTeams  `json:"latestVote,omitempty"`
}

type VoteWithTeams struct {
	ID          uint          `json:"id"`
	PollWeekID  uint          `json:"pollWeekId"`
	PollWeek    string        `json:"pollWeek"`
	WeekNumber  int           `json:"weekNumber"`
	Split       string        `json:"split"`
	Year        int           `json:"year"`
	Rankings    []TeamRanking `json:"rankings"`
	SubmittedAt string        `json:"submittedAt"`
}

func (h *PollsterHandler) ListPollsters(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset := (page - 1) * limit

	var total int64
	h.db.Model(&models.Voter{}).Where("role = ? AND is_active = ?", models.RolePollster, true).Count(&total)

	var voters []models.Voter
	if err := h.db.Where("role = ? AND is_active = ?", models.RolePollster, true).
		Order("name ASC").
		Limit(limit).
		Offset(offset).
		Find(&voters).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var pollsters []PollsterProfile
	for _, v := range voters {
		pollsters = append(pollsters, PollsterProfile{
			ID:        v.ID,
			Name:      v.Name,
			Outlet:    v.Outlet,
			Region:    string(v.Region),
			Role:      string(v.Role),
			IsActive:  v.IsActive,
			CreatedAt: v.CreatedAt.Format("2006-01-02"),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"pollsters":  pollsters,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": (int(total) + limit - 1) / limit,
	})
}

func (h *PollsterHandler) GetPollster(c *gin.Context) {
	identifier := c.Param("identifier")

	var voter models.Voter
	var err error

	if _, err := strconv.ParseUint(identifier, 10, 32); err == nil {
		id, _ := strconv.ParseUint(identifier, 10, 32)
		err = h.db.First(&voter, id).Error
	} else {
		err = h.db.Where("username = ?", identifier).First(&voter).Error
	}

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pollster not found"})
		return
	}

	pollster := PollsterProfile{
		ID:        voter.ID,
		Name:      voter.Name,
		Username:  voter.Username,
		Outlet:    voter.Outlet,
		Region:    string(voter.Region),
		Role:      string(voter.Role),
		IsActive:  voter.IsActive,
		Bio:       voter.Bio,
		Photo:     voter.Photo,
		CreatedAt: voter.CreatedAt.Format("2006-01-02"),
	}

	var latestVote *VoteWithTeams
	var vote models.Vote
	if err := h.db.Where("voter_id = ?", voter.ID).Order("submitted_at DESC").First(&vote).Error; err == nil {
		var rankings []TeamRanking
		json.Unmarshal([]byte(vote.Rankings), &rankings)

		var pollWeek models.PollWeek
		h.db.First(&pollWeek, vote.PollWeekID)

		teamIDs := make([]uint, len(rankings))
		for i, r := range rankings {
			teamIDs[i] = r.TeamID
		}

		var teams []models.Team
		if len(teamIDs) > 0 {
			h.db.Where("id IN ?", teamIDs).Find(&teams)
		}
		teamMap := make(map[uint]models.Team)
		for _, t := range teams {
			teamMap[t.ID] = t
		}

		var enrichedRankings []TeamRanking
		for _, r := range rankings {
			if team, ok := teamMap[r.TeamID]; ok {
				enrichedRankings = append(enrichedRankings, TeamRanking{
					TeamID:     r.TeamID,
					Rank:       r.Rank,
					TeamName:   team.Name,
					TeamShort:  team.ShortName,
					TeamLogo:   team.Logo,
					TeamRegion: string(team.Region),
				})
			}
		}

		latestVote = &VoteWithTeams{
			ID:          vote.ID,
			PollWeekID:  vote.PollWeekID,
			PollWeek:    string(pollWeek.Split) + " " + strconv.Itoa(pollWeek.Year),
			WeekNumber:  pollWeek.WeekNumber,
			Split:       string(pollWeek.Split),
			Year:        pollWeek.Year,
			Rankings:    enrichedRankings,
			SubmittedAt: vote.SubmittedAt.Format("2006-01-02"),
		}
	}

	c.JSON(http.StatusOK, PollsterResponse{
		Pollster:   pollster,
		LatestVote: latestVote,
	})
}

func (h *PollsterHandler) GetPollsterVotes(c *gin.Context) {
	identifier := c.Param("identifier")

	var voter models.Voter
	var err error

	if _, err := strconv.ParseUint(identifier, 10, 32); err == nil {
		id, _ := strconv.ParseUint(identifier, 10, 32)
		err = h.db.First(&voter, id).Error
	} else {
		err = h.db.Where("username = ?", identifier).First(&voter).Error
	}

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Pollster not found"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	var total int64
	h.db.Model(&models.Vote{}).Where("voter_id = ?", voter.ID).Count(&total)

	var votes []models.Vote
	if err := h.db.Where("voter_id = ?", voter.ID).
		Order("submitted_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&votes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var result []VoteWithTeams
	for _, vote := range votes {
		var rankings []TeamRanking
		json.Unmarshal([]byte(vote.Rankings), &rankings)

		var pollWeek models.PollWeek
		h.db.First(&pollWeek, vote.PollWeekID)

		teamIDs := make([]uint, len(rankings))
		for i, r := range rankings {
			teamIDs[i] = r.TeamID
		}

		var teams []models.Team
		if len(teamIDs) > 0 {
			h.db.Where("id IN ?", teamIDs).Find(&teams)
		}
		teamMap := make(map[uint]models.Team)
		for _, t := range teams {
			teamMap[t.ID] = t
		}

		var enrichedRankings []TeamRanking
		for _, r := range rankings {
			if team, ok := teamMap[r.TeamID]; ok {
				enrichedRankings = append(enrichedRankings, TeamRanking{
					TeamID:     r.TeamID,
					Rank:       r.Rank,
					TeamName:   team.Name,
					TeamShort:  team.ShortName,
					TeamLogo:   team.Logo,
					TeamRegion: string(team.Region),
				})
			}
		}

		result = append(result, VoteWithTeams{
			ID:          vote.ID,
			PollWeekID:  vote.PollWeekID,
			PollWeek:    string(pollWeek.Split) + " " + strconv.Itoa(pollWeek.Year),
			WeekNumber:  pollWeek.WeekNumber,
			Split:       string(pollWeek.Split),
			Year:        pollWeek.Year,
			Rankings:    enrichedRankings,
			SubmittedAt: vote.SubmittedAt.Format("2006-01-02"),
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"votes":      result,
		"total":      total,
		"page":       page,
		"limit":      limit,
		"totalPages": (int(total) + limit - 1) / limit,
	})
}

type UpdateProfileRequest struct {
	Bio   string `json:"bio"`
	Photo string `json:"photo"`
}

func (h *PollsterHandler) UpdateProfile(c *gin.Context) {
	token := c.GetHeader("Authorization")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization required"})
		return
	}

	token = strings.TrimPrefix(token, "Bearer ")

	var voterID uint
	if strings.HasPrefix(token, "simple-token-") {
		idStr := strings.TrimPrefix(token, "simple-token-")
		id, err := strconv.ParseUint(idStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}
		voterID = uint(id)
	} else {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token format"})
		return
	}

	var voter models.Voter
	if err := h.db.First(&voter, voterID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Voter not found"})
		return
	}

	if voter.Role != models.RolePollster && voter.Role != models.RoleAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only pollsters can update their profile"})
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Bio != "" {
		voter.Bio = req.Bio
	}
	if req.Photo != "" {
		voter.Photo = req.Photo
	}

	if err := h.db.Save(&voter).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	c.JSON(http.StatusOK, PollsterProfile{
		ID:        voter.ID,
		Name:      voter.Name,
		Username:  voter.Username,
		Outlet:    voter.Outlet,
		Region:    string(voter.Region),
		Role:      string(voter.Role),
		IsActive:  voter.IsActive,
		Bio:       voter.Bio,
		Photo:     voter.Photo,
		CreatedAt: voter.CreatedAt.Format("2006-01-02"),
	})
}
