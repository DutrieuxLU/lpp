package services

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"lpp-backend/internal/models"

	"gorm.io/gorm"
)

const (
	LolEsportsAPIURL = "https://esports-api.lolesports.com/persisted/gw/getTeams"
	LolesportsAPIKey = "0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z"
)

type TeamSyncService struct {
	db *gorm.DB
}

type LOLTeamResponse struct {
	Data LOLTeamData `json:"data"`
}

type LOLTeamData struct {
	Teams []LOLTeam `json:"teams"`
}

type LOLTeam struct {
	ID         string        `json:"id"`
	Slug       string        `json:"slug"`
	Name       string        `json:"name"`
	Code       string        `json:"code"`
	Image      string        `json:"image"`
	HomeLeague LOLHomeLeague `json:"homeLeague"`
	Status     string        `json:"status"`
}

type LOLHomeLeague struct {
	Name   string `json:"name"`
	Region string `json:"region"`
}

func NewTeamSyncService(db *gorm.DB) *TeamSyncService {
	return &TeamSyncService{db: db}
}

func (s *TeamSyncService) SyncTeams() (int, int, error) {
	req, err := http.NewRequest("GET", LolEsportsAPIURL+"?hl=en-US", nil)
	if err != nil {
		return 0, 0, err
	}
	req.Header.Set("x-api-key", LolesportsAPIKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return 0, 0, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, 0, err
	}

	var teamResp LOLTeamResponse
	if err := json.Unmarshal(body, &teamResp); err != nil {
		return 0, 0, fmt.Errorf("failed to parse response: %v", err)
	}

	created := 0
	updated := 0

	for _, team := range teamResp.Data.Teams {
		if team.HomeLeague.Name == "" || team.Status != "active" {
			continue
		}

		region := s.mapLeagueToRegion(team.HomeLeague.Name)
		if region == "" {
			continue
		}

		var existing models.Team
		err := s.db.Where("external_id = ?", team.ID).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			newTeam := models.Team{
				Name:       team.Name,
				ShortName:  team.Code,
				Region:     region,
				Logo:       team.Image,
				ExternalID: team.ID,
			}
			if err := s.db.Create(&newTeam).Error; err != nil {
				continue
			}
			created++
		} else if err == nil {
			existing.Name = team.Name
			existing.ShortName = team.Code
			existing.Region = region
			existing.Logo = team.Image
			if err := s.db.Save(&existing).Error; err != nil {
				continue
			}
			updated++
		}
	}

	return created, updated, nil
}

func (s *TeamSyncService) mapLeagueToRegion(league string) models.Region {
	league = strings.ToUpper(league)
	switch league {
	case "LCK":
		return models.RegionLCK
	case "LCS":
		return models.RegionLCS
	case "LEC":
		return models.RegionLEC
	case "LPL":
		return models.RegionLPL
	case "CBLOL":
		return models.RegionCBLOL
	case "PCS", "LCP":
		return models.RegionPCS
	case "LLA", "VCS":
		return ""
	default:
		return ""
	}
}
