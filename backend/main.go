package main

import (
	"fmt"

	"lexiflow/backend/internal/config"
	"lexiflow/backend/internal/database"
	httpServer "lexiflow/backend/internal/http"
)

func main() {
	cfg := config.Load()
	db := database.Connect(cfg.DatabaseURL)

	srv := httpServer.NewServer(cfg, db)

	addr := fmt.Sprintf(":%s", cfg.Port)
	if err := srv.Run(addr); err != nil {
		panic(err)
	}
}
