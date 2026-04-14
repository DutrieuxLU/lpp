package main

import (
	"encoding/json"
	"log"
	"time"

	"lpp-backend/internal/config"
	"lpp-backend/internal/db"
	"lpp-backend/internal/models"
	"lpp-backend/internal/services"

	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()
	database, err := db.Connect(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	seedData(database)
	log.Println("Seed data completed!")
}

func seedData(db *gorm.DB) {
	db.Exec("DELETE FROM rankings")
	db.Exec("DELETE FROM votes")
	db.Exec("DELETE FROM poll_weeks")
	db.Exec("DELETE FROM voters")

	var teamCount int64
	db.Model(&models.Team{}).Count(&teamCount)
	if teamCount < 10 {
		log.Println("Syncing teams from external API first...")
		svc := services.NewTeamSyncService(db)
		svc.SyncTeams()
	}

	var teams []models.Team
	db.Where("logo != '' AND logo IS NOT NULL").Find(&teams)
	teamMapByName := make(map[string]uint)
	teamMapByShort := make(map[string]uint)
	for _, t := range teams {
		teamMapByName[t.Name] = t.ID
		teamMapByShort[t.ShortName] = t.ID
	}
	log.Printf("Using %d teams with logos", len(teams))

	pollWeek := models.PollWeek{
		Year:        2026,
		Split:       models.SplitSpring,
		WeekNumber:  1,
		PublishDate: time.Now(),
		Status:      models.PollStatusPublished,
	}
	if err := db.Create(&pollWeek).Error; err != nil {
		log.Fatalf("Failed to create poll week: %v", err)
	}
	log.Printf("Created poll week: Week %d %s %d", pollWeek.WeekNumber, pollWeek.Split, pollWeek.Year)

	// Use short names that match the synced API data
	rankingsData := []struct {
		shortName string
		points    int
		fpv       int
	}{
		{"BLG", 18, 3}, // Bilibili Gaming
		{"GEN", 16, 2}, // Gen.G
		{"T1", 14, 1},
		{"JDG", 12, 0},
		{"G2", 11, 0},
		{"TES", 10, 0},
		{"FNC", 9, 0},
		{"TL", 8, 0},
		{"C9", 7, 0},
		{"HLE", 6, 0},
		{"EDG", 5, 0},
		{"MAD", 4, 0},
		{"100T", 3, 0},
		{"PSG", 2, 0},
		{"DRX", 1, 0},
	}

	var rankings []models.Ranking
	for i, r := range rankingsData {
		teamID := teamMapByShort[r.shortName]
		if teamID == 0 {
			log.Printf("Warning: team %s not found in DB, skipping", r.shortName)
			continue
		}
		rankings = append(rankings, models.Ranking{
			PollWeekID:      pollWeek.ID,
			TeamID:          teamID,
			Rank:            i + 1,
			Points:          r.points,
			FirstPlaceVotes: r.fpv,
		})
	}

	if err := db.Create(&rankings).Error; err != nil {
		log.Fatalf("Failed to seed rankings: %v", err)
	}
	log.Printf("Seeded %d rankings", len(rankings))

	// Create John Pollster
	johnPollster := models.Voter{
		Name:     "John Pollster",
		Outlet:   "Esports Weekly",
		Email:    "john@lpp.com",
		Password: "pollster123",
		Role:     models.RolePollster,
		Region:   models.RegionLCS,
		IsActive: true,
	}
	if err := db.Create(&johnPollster).Error; err != nil {
		log.Fatalf("Failed to create John Pollster: %v", err)
	}
	log.Printf("Created voter: %s (John Pollster - LCS)", johnPollster.Email)

	// Create John Pollster's vote for Week 1
	johnRankings := []struct {
		shortName string
		rank      int
	}{
		{"C9", 1},
		{"TL", 2},
		{"100T", 3},
		{"FLY", 4},
		{"DIG", 5},
		{"TSM", 6},
		{"NRG", 7},
		{"CLG", 8},
		{"IMT", 9},
		{"SR", 10},
	}

	var rankingsSlice []map[string]interface{}
	for _, r := range johnRankings {
		teamID := teamMapByShort[r.shortName]
		if teamID == 0 {
			log.Printf("Warning: team %s not found in DB, skipping vote entry", r.shortName)
			continue
		}
		rankingsSlice = append(rankingsSlice, map[string]interface{}{
			"teamId": teamID,
			"rank":   r.rank,
		})
	}

	rankingsJSON, _ := json.Marshal(rankingsSlice)
	vote := models.Vote{
		PollWeekID:  pollWeek.ID,
		VoterID:     johnPollster.ID,
		Rankings:    string(rankingsJSON),
		SubmittedAt: time.Now().Add(-time.Hour * 2),
	}
	if err := db.Create(&vote).Error; err != nil {
		log.Fatalf("Failed to create John Pollster's vote: %v", err)
	}
	log.Printf("Created vote for John Pollster: Week %d %s %d", pollWeek.WeekNumber, pollWeek.Split, pollWeek.Year)

	voters := []models.Voter{
		{
			Name:     "Test Voter",
			Outlet:   "Test Outlet",
			Email:    "voter@lpp.com",
			Password: "password123",
			Region:   models.RegionLCS,
			IsActive: true,
		},
		{
			Name:     "Laurent Dutrieux",
			Outlet:   "LPP",
			Email:    "dutrieuxl31022@gmail.com",
			Password: "Cubs2016@",
			Region:   models.RegionLEC,
			IsActive: true,
		},
	}
	if err := db.Create(&voters).Error; err != nil {
		log.Fatalf("Failed to create voters: %v", err)
	}
	for _, v := range voters {
		log.Printf("Created voter: %s", v.Email)
	}
}
