package config

import (
	"os"
)

type Config struct {
	Port            string
	DatabaseURL     string
	CitoAPIKey      string
	JWTSecret       string
	TurnstileSecret string
	SentryDSN       string
	ResendAPIKey    string
	ResendFromEmail string
}

func Load() *Config {
	return &Config{
		Port:            getEnv("PORT", "8080"),
		DatabaseURL:     getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/lpp?sslmode=disable"),
		CitoAPIKey:      getEnv("CITO_API_KEY", ""),
		JWTSecret:       getEnv("JWT_SECRET", ""),
		TurnstileSecret: getEnv("TURNSTILE_SECRET", ""),
		SentryDSN:       getEnv("SENTRY_DSN", ""),
		ResendAPIKey:    getEnv("RESEND_API_KEY", ""),
		ResendFromEmail: getEnv("RESEND_FROM_EMAIL", ""),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
