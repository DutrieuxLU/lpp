package db

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMain(m *testing.M) {
	if dbError == nil {
		if err := SetupTestDB(); err != nil {
			dbError = err
		}
	}
	os.Exit(m.Run())
}

func TestDatabaseConnection(t *testing.T) {
	if dbError != nil {
		t.Skipf("Skipping test: database connection failed: %v", dbError)
	}

	require.NotNil(t, DB, "Database should not be nil")
	assert.NoError(t, dbError, "Database connection should not have errors")
}

func TestDatabasePing(t *testing.T) {
	if dbError != nil {
		t.Skipf("Skipping test: database connection failed: %v", dbError)
	}

	sqlDB, err := DB.DB()
	require.NoError(t, err, "Should get underlying sql.DB")

	err = sqlDB.Ping()
	assert.NoError(t, err, "Should be able to ping database")
}

func TestDatabaseTablesExistAfterMigration(t *testing.T) {
	if dbError != nil {
		t.Skipf("Skipping test: database connection failed: %v", dbError)
	}

	tables := []string{
		"teams",
		"poll_weeks",
		"voters",
		"votes",
		"rankings",
		"matches",
	}

	for _, table := range tables {
		var count int64
		err := DB.Raw("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = ?", table).Scan(&count).Error
		assert.NoError(t, err, "Should query table existence")
		assert.Equal(t, int64(1), count, "Table %s should exist", table)
	}
}

func TestDatabaseTruncateTables(t *testing.T) {
	if dbError != nil {
		t.Skipf("Skipping test: database connection failed: %v", dbError)
	}

	err := TruncateTables()
	assert.NoError(t, err, "Should truncate all tables")
}
