package config

import (
	"os"
)

type Config struct {
	Port        string
	DatabaseURL string
	CitoAPIKey  string
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/lpp?sslmode=disable"),
		CitoAPIKey:  getEnv("CITO_API_KEY", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
