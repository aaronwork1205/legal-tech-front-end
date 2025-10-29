package main

import (
	"fmt"
	"log"
	"os"

	"lexiflow/backend/internal/config"
	"lexiflow/backend/internal/database"
	httpServer "lexiflow/backend/internal/http"
)

func main() {
	cfg := config.Load()
	if err := os.MkdirAll(cfg.UploadDir, 0o775); err != nil {
		log.Fatalf("unable to create upload directory: %v", err)
	}
	db := database.Connect(cfg.DatabaseURL)

	srv := httpServer.NewServer(cfg, db)

	addr := fmt.Sprintf(":%s", cfg.Port)
	if err := srv.Run(addr); err != nil {
		panic(err)
	}
}
