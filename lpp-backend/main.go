package main

import (
	"log"
	"os"

	"lpp-backend/cmd/server"
	"lpp-backend/internal/config"
)

func main() {
	cfg := config.Load()

	if err := server.Run(cfg); err != nil {
		log.Printf("Server error: %v", err)
		os.Exit(1)
	}
}
