package server

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"lpp-backend/internal/config"
	"lpp-backend/internal/db"
	"lpp-backend/internal/handlers"
	"lpp-backend/internal/middleware"
	"lpp-backend/internal/security"

	"github.com/getsentry/sentry-go"
	sentrygin "github.com/getsentry/sentry-go/gin"
	"github.com/gin-gonic/gin"
)

func envOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func Run(cfg *config.Config) error {
	database, err := db.Connect(cfg)
	if err != nil {
		return err
	}

	if err := security.ValidateSecret(cfg.JWTSecret); cfg.JWTSecret != "" && err != nil {
		return fmt.Errorf("invalid JWT secret: %w", err)
	}

	if cfg.SentryDSN != "" {
		err := sentry.Init(sentry.ClientOptions{
			Dsn:              cfg.SentryDSN,
			Environment:      envOrDefault("ENVIRONMENT", "development"),
			Release:          "lpp-backend@1.0.0",
			AttachStacktrace: true,
			SendDefaultPII:   false,
			TracesSampler: func(ctx sentry.SamplingContext) float64 {
				if ctx.Span.Op == "server.handler.health" {
					return 0
				}
				return 0.1
			},
		})
		if err != nil {
			log.Printf("Sentry initialization failed: %v", err)
		} else {
			log.Println("Sentry initialized")
		}
	}

	router := gin.Default()

	if cfg.SentryDSN != "" {
		router.Use(sentrygin.New(sentrygin.Options{
			Repanic: true,
		}))
	}

	router.Use(corsMiddleware())

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := router.Group("/api/v1")
	{
		handlers.RegisterRankingRoutes(api, database)
		handlers.RegisterTeamRoutes(api, database)
		handlers.RegisterWeekRoutes(api, database)
		handlers.RegisterVoteRoutes(api, database)

		authGroup := api.Group("/auth")
		authGroup.Use(middleware.RateLimit(5, time.Minute))
		handlers.RegisterAuthRoutes(authGroup, database, cfg)

		handlers.RegisterApplicationRoutes(api, database)
		handlers.RegisterPollsterRoutes(api, database)
		handlers.RegisterVoterRoutes(api, database)
	}

	log.Printf("Server starting on port %s", cfg.Port)
	return router.Run(":" + cfg.Port)
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
