package services

import (
	"encoding/json"
	"sort"

	"lpp-backend/internal/models"

	"gorm.io/gorm"
)

type RankingService struct {
	db *gorm.DB
}

type TeamRanking struct {
	TeamID uint `json:"teamId"`
	Rank   int  `json:"rank"`
}

type VoteWithRankings struct {
	models.Vote
	Rankings []TeamRanking `json:"-"`
}

func NewRankingService(db *gorm.DB) *RankingService {
	return &RankingService{db: db}
}

func (s *RankingService) CalculateRankings(pollWeekID uint) ([]models.Ranking, error) {
	var votes []models.Vote
	if err := s.db.Where("poll_week_id = ?", pollWeekID).Find(&votes).Error; err != nil {
		return nil, err
	}

	teamPoints := make(map[uint]int)
	firstPlaceVotes := make(map[uint]int)

	for _, vote := range votes {
		var rankings []TeamRanking
		if err := json.Unmarshal([]byte(vote.Rankings), &rankings); err != nil {
			continue
		}

		for _, r := range rankings {
			points := 26 - r.Rank
			if points > 0 {
				teamPoints[r.TeamID] += points
			}
			if r.Rank == 1 {
				firstPlaceVotes[r.TeamID]++
			}
		}
	}

	type teamScore struct {
		teamID          uint
		points          int
		firstPlaceVotes int
	}

	var scores []teamScore
	for teamID, points := range teamPoints {
		scores = append(scores, teamScore{
			teamID:          teamID,
			points:          points,
			firstPlaceVotes: firstPlaceVotes[teamID],
		})
	}

	sort.Slice(scores, func(i, j int) bool {
		if scores[i].points != scores[j].points {
			return scores[i].points > scores[j].points
		}
		return scores[i].firstPlaceVotes > scores[j].firstPlaceVotes
	})

	s.db.Where("poll_week_id = ?", pollWeekID).Delete(&models.Ranking{})

	var rankings []models.Ranking
	for i, score := range scores {
		ranking := models.Ranking{
			PollWeekID:      pollWeekID,
			TeamID:          score.teamID,
			Rank:            i + 1,
			Points:          score.points,
			FirstPlaceVotes: score.firstPlaceVotes,
		}
		rankings = append(rankings, ranking)
		s.db.Create(&ranking)
	}

	return rankings, nil
}
