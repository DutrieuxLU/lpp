package db

import (
	"fmt"
	"os"
	"strings"

	"lpp-backend/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	DB      *gorm.DB
	dbError error
)

func init() {
	testDatabaseURL := os.Getenv("TEST_DATABASE_URL")
	if testDatabaseURL == "" {
		testDatabaseURL = "postgres://postgres:postgres@localhost:5433/lpp_test?sslmode=disable"
	}

	DB, dbError = gorm.Open(postgres.Open(testDatabaseURL), &gorm.Config{})
	if dbError != nil {
		fmt.Printf("Failed to connect to test database: %v\n", dbError)
		return
	}

	sqlDB, err := DB.DB()
	if err != nil {
		dbError = fmt.Errorf("failed to get sql.DB: %w", err)
		return
	}

	if err := sqlDB.Ping(); err != nil {
		dbError = fmt.Errorf("failed to ping database: %w", err)
	}
}

func GetDB() *gorm.DB {
	if dbError != nil {
		return nil
	}
	return DB
}

func GetDBError() error {
	return dbError
}

func SetupTestDB() error {
	if dbError != nil {
		return dbError
	}

	if err := DB.AutoMigrate(
		&models.Team{},
		&models.PollWeek{},
		&models.Voter{},
		&models.Vote{},
		&models.Ranking{},
		&models.Match{},
	); err != nil {
		return fmt.Errorf("failed to run migrations: %w", err)
	}

	return nil
}

func TruncateTables() error {
	if dbError != nil {
		return dbError
	}

	tables := []string{"applications", "matches", "rankings", "votes", "voters", "poll_weeks", "teams"}
	for _, table := range tables {
		err := DB.Exec("TRUNCATE TABLE " + table + " CASCADE").Error
		if err != nil && !strings.Contains(err.Error(), "does not exist") {
			return fmt.Errorf("failed to truncate %s: %w", table, err)
		}
	}
	return nil
}
