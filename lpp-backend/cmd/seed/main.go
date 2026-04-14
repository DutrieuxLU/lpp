package main

import (
	"log"
	"time"

	"lpp-backend/internal/config"
	"lpp-backend/internal/db"
	"lpp-backend/internal/models"
	"lpp-backend/internal/security"
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
	db.Exec("DELETE FROM email_codes")
	db.Exec("DELETE FROM refresh_tokens")
	db.Exec("DELETE FROM rankings")
	db.Exec("DELETE FROM votes")
	db.Exec("DELETE FROM poll_weeks")
	db.Exec("DELETE FROM applications")
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

	rankingsData := []struct {
		shortName string
		points    int
		fpv       int
	}{
		{"BLG", 18, 3},
		{"GEN", 16, 2},
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

	adminPassword := "21405#*3o2oij@^*(@RMKQ.sA@aosdijf"
	hashedAdminPassword, err := security.HashPassword(adminPassword)
	if err != nil {
		log.Fatalf("Failed to hash admin password: %v", err)
	}

	adminVoter := models.Voter{
		Name:     "Laurent Dutrieux",
		Username: "admin",
		Outlet:   "LPP Admin",
		Email:    "dutrieuxl31022@gmail.com",
		Password: hashedAdminPassword,
		Role:     models.RoleAdmin,
		Region:   models.RegionLEC,
		IsActive: true,
	}
	if err := db.Create(&adminVoter).Error; err != nil {
		log.Fatalf("Failed to create admin: %v", err)
	}
	log.Printf("Created admin voter: %s (role: admin)", adminVoter.Email)

	johnPollster := models.Voter{
		Name:     "John Pollster",
		Username: "johnpollster",
		Outlet:   "Esports Weekly",
		Email:    "john@lpp.com",
		Password: "pollster123",
		Role:     models.RolePollster,
		Region:   models.RegionLCS,
		IsActive: true,
		Bio:      "Esports journalist covering the LCS since 2020.",
	}
	if err := db.Create(&johnPollster).Error; err != nil {
		log.Fatalf("Failed to create John Pollster: %v", err)
	}
	log.Printf("Created voter: %s (John Pollster - LCS)", johnPollster.Email)
}
