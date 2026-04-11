package main

import (
	"log"

	"lpp-backend/internal/config"
	"lpp-backend/internal/db"
	"lpp-backend/internal/services"
)

func main() {
	cfg := config.Load()
	database, err := db.Connect(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	syncService := services.NewTeamSyncService(database)
	created, updated, err := syncService.SyncTeams()
	if err != nil {
		log.Fatalf("Failed to sync teams: %v", err)
	}

	log.Printf("Team sync completed: %d created, %d updated", created, updated)
}
