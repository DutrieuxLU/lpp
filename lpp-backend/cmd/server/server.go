package server

import (
	"log"
	"net/http"

	"lpp-backend/internal/config"
	"lpp-backend/internal/db"
	"lpp-backend/internal/handlers"

	"github.com/gin-gonic/gin"
)

func Run(cfg *config.Config) error {
	database, err := db.Connect(cfg)
	if err != nil {
		return err
	}

	router := gin.Default()

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := router.Group("/api/v1")
	{
		handlers.RegisterRankingRoutes(api, database)
		handlers.RegisterTeamRoutes(api, database)
		handlers.RegisterWeekRoutes(api, database)
		handlers.RegisterVoteRoutes(api, database)
	}

	log.Printf("Server starting on port %s", cfg.Port)
	return router.Run(":" + cfg.Port)
}
