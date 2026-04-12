package main

import (
	"log"
	"time"

	"lpp-backend/internal/config"
	"lpp-backend/internal/db"
	"lpp-backend/internal/models"

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
	db.Exec("DELETE FROM teams")
	db.Exec("DELETE FROM voters")

	teams := []models.Team{
		// LCK (Korean)
		{Name: "Gen.G", ShortName: "GEN", Region: models.RegionLCK, Logo: ""},
		{Name: "T1", ShortName: "T1", Region: models.RegionLCK, Logo: ""},
		{Name: "Hanwha Life Esports", ShortName: "HLE", Region: models.RegionLCK, Logo: ""},
		{Name: "DRX", ShortName: "DRX", Region: models.RegionLCK, Logo: ""},
		{Name: "Dplus KIA", ShortName: "DK", Region: models.RegionLCK, Logo: ""},
		{Name: "Freecs", ShortName: "KDF", Region: models.RegionLCK, Logo: ""},
		{Name: "Nongshim RedForce", ShortName: "NS", Region: models.RegionLCK, Logo: ""},
		{Name: "Liiv SANDBOX", ShortName: "LSB", Region: models.RegionLCK, Logo: ""},

		// LPL (Chinese)
		{Name: "Bilibili Gaming", ShortName: "BLG", Region: models.RegionLPL, Logo: ""},
		{Name: "JD Gaming", ShortName: "JDG", Region: models.RegionLPL, Logo: ""},
		{Name: "Top Esports", ShortName: "TES", Region: models.RegionLPL, Logo: ""},
		{Name: "Edward Gaming", ShortName: "EDG", Region: models.RegionLPL, Logo: ""},
		{Name: "LNG Esports", ShortName: "LNG", Region: models.RegionLPL, Logo: ""},
		{Name: "Weibo Gaming", ShortName: "WBG", Region: models.RegionLPL, Logo: ""},
		{Name: "Royal Never Give Up", ShortName: "RNG", Region: models.RegionLPL, Logo: ""},
		{Name: "Team WE", ShortName: "WE", Region: models.RegionLPL, Logo: ""},

		// LEC (European)
		{Name: "G2 Esports", ShortName: "G2", Region: models.RegionLEC, Logo: ""},
		{Name: "Fnatic", ShortName: "FNC", Region: models.RegionLEC, Logo: ""},
		{Name: "MAD Lions", ShortName: "MAD", Region: models.RegionLEC, Logo: ""},
		{Name: "Team BDS", ShortName: "BDS", Region: models.RegionLEC, Logo: ""},
		{Name: "Rogue", ShortName: "RGE", Region: models.RegionLEC, Logo: ""},
		{Name: "Excel Esports", ShortName: "XL", Region: models.RegionLEC, Logo: ""},
		{Name: "SK Gaming", ShortName: "SK", Region: models.RegionLEC, Logo: ""},
		{Name: "Team Heretics", ShortName: "TH", Region: models.RegionLEC, Logo: ""},

		// LCS (North American)
		{Name: "Team Liquid", ShortName: "TL", Region: models.RegionLCS, Logo: ""},
		{Name: "Cloud9", ShortName: "C9", Region: models.RegionLCS, Logo: ""},
		{Name: "100 Thieves", ShortName: "100T", Region: models.RegionLCS, Logo: ""},
		{Name: "Evil Geniuses", ShortName: "EG", Region: models.RegionLCS, Logo: ""},
		{Name: "FlyQuest", ShortName: "FLY", Region: models.RegionLCS, Logo: ""},
		{Name: "NRG Esports", ShortName: "NRG", Region: models.RegionLCS, Logo: ""},
		{Name: "Shopify Rebellion", ShortName: "SBR", Region: models.RegionLCS, Logo: ""},
		{Name: "Immortals", ShortName: "IMT", Region: models.RegionLCS, Logo: ""},

		// PCS (Pacific - shown as LCP)
		{Name: "PSG Talon", ShortName: "PSG", Region: models.RegionPCS, Logo: ""},
		{Name: "Flyquest", ShortName: "FYQ", Region: models.RegionPCS, Logo: ""},
		{Name: "Bin", ShortName: "BIN", Region: models.RegionPCS, Logo: ""},
		{Name: "CTBC Flying", ShortName: "CFO", Region: models.RegionPCS, Logo: ""},
		{Name: "Talon Esports", ShortName: "TLN", Region: models.RegionPCS, Logo: ""},
		{Name: "Team Secret", ShortName: "SEC", Region: models.RegionPCS, Logo: ""},
	}

	if err := db.Create(&teams).Error; err != nil {
		log.Fatalf("Failed to seed teams: %v", err)
	}
	log.Printf("Seeded %d teams", len(teams))

	teamMap := make(map[string]uint)
	for _, t := range teams {
		teamMap[t.Name] = t.ID
	}

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

	rankings := []models.Ranking{
		{PollWeekID: pollWeek.ID, TeamID: teamMap["Bilibili Gaming"], Rank: 1, Points: 18, FirstPlaceVotes: 3},
		{PollWeekID: pollWeek.ID, TeamID: teamMap["Gen.G"], Rank: 2, Points: 16, FirstPlaceVotes: 2},
		{PollWeekID: pollWeek.ID, TeamID: teamMap["T1"], Rank: 3, Points: 14, FirstPlaceVotes: 1},
		{PollWeekID: pollWeek.ID, TeamID: teamMap["JD Gaming"], Rank: 4, Points: 12, FirstPlaceVotes: 0},
		{PollWeekID: pollWeek.ID, TeamID: teamMap["G2 Esports"], Rank: 5, Points: 11, FirstPlaceVotes: 0},
		{PollWeekID: pollWeek.ID, TeamID: teamMap["Top Esports"], Rank: 6, Points: 10, FirstPlaceVotes: 0},
		{PollWeekID: pollWeek.ID, TeamID: teamMap["Fnatic"], Rank: 7, Points: 9, FirstPlaceVotes: 0},
		{PollWeekID: pollWeek.ID, TeamID: teamMap["Team Liquid"], Rank: 8, Points: 8, FirstPlaceVotes: 0},
		{PollWeekID: pollWeek.ID, TeamID: teamMap["Cloud9"], Rank: 9, Points: 7, FirstPlaceVotes: 0},
		{PollWeekID: pollWeek.ID, TeamID: teamMap["Hanwha Life Esports"], Rank: 10, Points: 6, FirstPlaceVotes: 0},
		{PollWeekID: pollWeek.ID, TeamID: teamMap["Edward Gaming"], Rank: 11, Points: 5, FirstPlaceVotes: 0},
		{PollWeekID: pollWeek.ID, TeamID: teamMap["MAD Lions"], Rank: 12, Points: 4, FirstPlaceVotes: 0},
		{PollWeekID: pollWeek.ID, TeamID: teamMap["100 Thieves"], Rank: 13, Points: 3, FirstPlaceVotes: 0},
		{PollWeekID: pollWeek.ID, TeamID: teamMap["PSG Talon"], Rank: 14, Points: 2, FirstPlaceVotes: 0},
		{PollWeekID: pollWeek.ID, TeamID: teamMap["DRX"], Rank: 15, Points: 1, FirstPlaceVotes: 0},
	}

	if err := db.Create(&rankings).Error; err != nil {
		log.Fatalf("Failed to seed rankings: %v", err)
	}
	log.Printf("Seeded %d rankings", len(rankings))

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
