package db

import (
	"log"

	"lpp-backend/internal/config"
	"lpp-backend/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Connect(cfg *config.Config) (*gorm.DB, error) {
	return ConnectWithConfig(cfg.DatabaseURL)
}

func ConnectWithConfig(databaseURL string) (*gorm.DB, error) {
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, err
	}

	if err := db.AutoMigrate(
		&models.Team{},
		&models.PollWeek{},
		&models.Voter{},
		&models.Vote{},
		&models.Ranking{},
		&models.Match{},
	); err != nil {
		return nil, err
	}

	log.Println("Database connected and migrated")
	return db, nil
}
